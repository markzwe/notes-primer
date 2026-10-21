import express from 'express';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Note } from './models/Notes.js';

const app = express();
app.use(express.json({ limit: '16kb' }));
const notes = [];

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

// Add the database availability check endpoint.
app.get('/api/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503)
    .json({ status: ready ? 'ready' : 'unavailable' });
});

// Add the database availability check middleware.
app.use('/api/examples/notes', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'database unavailable' });
  }
  next();
});

// Add the GET, POST, and error handlers here.

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
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
  });
    app.listen(3000, '127.0.0.1', () => {
      console.log('Listening on http://127.0.0.1:3000');
  });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exitCode = 1;
  }
