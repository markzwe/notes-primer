import { Router } from 'express';
import PrivateNote from '../models/PrivateNote.js';

export const privateNotesRouter = Router();

function viewNote(doc) {
    return {
        id: doc._id.toString(),
        text: doc.text,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

privateNotesRouter.get('/', async (req, res, next) => {
    try {
        const docs = await PrivateNote.find({ owner: req.auth.userId })
            .sort({ createdAt: -1, _id: -1 })
            .limit(50)
            .lean();
        return res.status(200).json({ notes: docs.map(viewNote) });
    } catch (err) {
        return next(err);
    }
});

privateNotesRouter.post('/', async (req, res, next) => {
    const raw = req.body?.text;
    if (typeof raw !== 'string') {
        return res.status(400).json({ error: 'invalid text' });
    }

    const text = raw.trim();
    if (text.length < 1 || text.length > 280) {
        return res.status(400).json({ error: 'invalid text' });
    }

    try {
        const doc = await PrivateNote.create({
            owner: req.auth.userId,
            text
        });
        return res.status(201).json({ note: viewNote(doc) });
    } catch (err) {
        return next(err);
    }
});

privateNotesRouter.get('/:id', async (req, res, next) => {
    const id = req.params.id;
    if (/^[0-9a-f]{24}$/i.test(id) === false) {
        return res.status(404).json({ error: 'note not found' });
    }

    try {
        const doc = await PrivateNote.findOne({
            _id: id,
            owner: req.auth.userId
        }).lean();
        if (doc === null) {
            return res.status(404).json({ error: 'note not found' });
        }
        return res.status(200).json({ note: viewNote(doc) });
    } catch (err) {
        return next(err);
    }
});
