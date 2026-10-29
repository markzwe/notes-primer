import express from 'express';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { PrimerUser } from './models/PrimerUser.js';
import { authRouter } from './routes/auth.js';
import { privateNotesRouter } from './routes/privateNotes.js';
import { requireAuth } from './middleware/requireAuth.js';
import { Note } from './models/Notes.js';
import PrivateNote from './models/PrivateNote.js';
import { studyRouter } from './routes/study.js';

const app = express();
// Parse JSON request bodies and cap their size to limit oversized payloads.
app.use(express.json({ limit: '16kb' }));
const notes = [];

// Convert a Mongoose note document into the public API response shape.
function noteView(doc) {
  return {
    id: doc._id.toString(),
    text: doc.text,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Liveness is independent of MongoDB; readiness reports whether it is connected.
app.get('/api/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503)
    .json({ status: ready ? 'ready' : 'unavailable' });
});

app.use('/api/study', requireDatabase, requireAuth, studyRouter);


// Keep example-note requests from querying MongoDB while it is unavailable.
app.use('/api/examples/notes', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'database unavailable' });
  }
  next();
});


// Middleware to ensure the database is available before handling certain routes.
// Reject API operations that require MongoDB until its connection is ready.
function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'database unavailable' });
  }
  next();
}
// 
// Authentication and private-note routes both require a live database.
app.use('/api/auth', requireDatabase, authRouter);
app.use('/api/private/notes', requireDatabase, requireAuth, privateNotesRouter);

// List the 50 newest example notes, using _id to keep ordering stable for ties.
app.get('/api/examples/notes', async (_req, res, next) => {
  try {
    const docs = await Note.find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({
      notes: docs.map(noteView)
    });
  } catch (err) {
    next(err);
  }
});

// Validate and save an example note supplied in the JSON request body.
app.post('/api/examples/notes', async (req, res, next) => {
  const raw = req.body?.text;
  if (typeof raw !== 'string') {
    return res.status(400).json({ error: 'invalid text' });
  }

  const text = raw.trim();
  if (text.length === 0 || text.length > 280) {
    return res.status(400).json({ error: 'invalid text' });
  }
  try {
    const doc = await Note.create({ text });
    return res.status(201).json(noteView(doc));
  } catch (err) {
    next(err);
  }
});

const mongoUri = process.env.MONGODB_URI ??
  'mongodb://127.0.0.1:27018/capstone_notes_primer';
try {
  // Connect before accepting requests so routes start with a known DB state.
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  await PrimerUser.init(); // ensure unique username index exists
  await PrivateNote.init(); // ensure owner index exists
  app.listen(3000, '127.0.0.1', () => {
    console.log('Listening on http://127.0.0.1:3000');
  });
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exitCode = 1;
}
