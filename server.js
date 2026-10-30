import mongoose from 'mongoose';
import { PrimerUser } from './models/PrimerUser.js';
import PrivateNote from './models/PrivateNote.js';
import { httpServer } from './app.js';

const mongoUri = process.env.MONGODB_URI ??
  'mongodb://127.0.0.1:27018/capstone_notes_primer';
try {
  // Connect before accepting requests so routes start with a known DB state.
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  await PrimerUser.init(); // ensure unique username index exists
  await PrivateNote.init(); // ensure owner index exists
  httpServer.listen(3000, '127.0.0.1', () => {
    console.log('Listening on http://127.0.0.1:3000');
  });
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exitCode = 1;
}
