import { Router } from 'express';
import { PrimerUser } from '../models/PrimerUser.js';
import { StudyBoard } from '../models/StudyBoard.js';
import { StudyEntry } from '../models/StudyEntry.js';
import { normalizedTitle, normalizedBody, normalizedInvitees } from '../study/input.js';
import { appendStudyEntry, studyBoardRoom } from '../study/appendEntry.js';

export const studyRouter = Router();
const objectIdPattern = /^[0-9a-f]{24}$/i;

// Keep database documents internal and expose stable API fields.
function viewBoard(doc) {
    return {
        id: doc._id.toString(), title: doc.title,
        members: doc.members.map(id => id.toString()),
        createdAt: doc.createdAt
    };
}

function viewEntry(doc) {
    return {
        id: doc._id.toString(), boardId: doc.board.toString(),
        authorId: doc.author.toString(),
        body: doc.body, createdAt: doc.createdAt
    };
}

// Find a board only if the requested ID is valid and the user belongs to it.
async function memberBoard(boardId, userId) {
    if (objectIdPattern.test(boardId) === false) return null;
    return StudyBoard.findOne({
        _id: boardId,
        members: userId
    }).lean();
}

studyRouter.post('/boards', async (req, res, next) => {
    const title = normalizedTitle(req.body?.title);
    const names = normalizedInvitees(req.body?.invitees);
    if (title === null || names === null) {
        return res.status(400).json({ error: 'invalid board input' });
    }

    try {
        const invitees = await PrimerUser.find({
            username: { $in: names }
        }).select('_id username').lean();
        if (invitees.length !== names.length ||
            invitees.some(user => user._id.toString() === req.auth.userId)) {
            return res.status(400).json({ error: 'invitee unavailable' });
        }

        const board = await StudyBoard.create({
            title,
            createdBy: req.auth.userId,
            members: [req.auth.userId, ...invitees.map(user => user._id)]
        });
        return res.status(201).json({ board: viewBoard(board) });
    } catch (err) {
        next(err);
    }
});

// List boards the authenticated user belongs to, newest first.
studyRouter.get('/boards', async (req, res, next) => {
    try {
        const boards = await StudyBoard.find({
            members: req.auth.userId
        }).sort({ createdAt: -1, _id: -1 }).limit(50).lean();
        return res.status(200).json({
            boards: boards.map(viewBoard)
        });
    } catch (err) {
        next(err);
    }
});

// Save an entry, then broadcast it to connected members of that board.
studyRouter.post('/boards/:boardId/entries', async (req, res, next) => {
    try {
        const result = await appendStudyEntry(
            req.params.boardId, req.auth.userId, req.body?.body
        );
        if (result.code === 'not_found') {
            return res.status(404).json({ error: 'board not found' });
        }
        if (result.code === 'invalid_body') {
            return res.status(400).json({ error: 'invalid entry body' });
        }
        req.app.get('studyIo').to(studyBoardRoom(result.entry.boardId))
            .emit('study:entry', result.entry);
        return res.status(201).json({ entry: result.entry });
    } catch (err) {
        next(err);
    }
});

// Return board history in pages of five, using an optional cursor for older entries.
studyRouter.get('/boards/:boardId/entries', async (req, res, next) => {
    try {
        const board = await memberBoard(req.params.boardId, req.auth.userId);
        if (board === null) {
            return res.status(404).json({ error: 'board not found' });
        }
        const before = req.query.before;
        const query = { board: board._id };
        if (before !== undefined) {
            if (typeof before !== 'string' || !objectIdPattern.test(before)) {
                return res.status(400).json({ error: 'invalid cursor' });
            }
            const anchor = await StudyEntry.findOne({
                _id: before, board: board._id
            }).select('createdAt').lean();
            if (anchor === null) {
                return res.status(400).json({ error: 'invalid cursor' });
            }
            query.$or = [
                { createdAt: { $lt: anchor.createdAt } },
                { createdAt: anchor.createdAt, _id: { $lt: anchor._id } }
            ];
        }

        const docs = await StudyEntry.find(query)
            .sort({ createdAt: -1, _id: -1 }).limit(6).lean();
        const page = docs.slice(0, 5);
        return res.status(200).json({
            entries: page.map(viewEntry),
            nextBefore: docs.length > 5 ? page.at(-1)._id.toString() : null
        });
    } catch (err) {
        next(err);
    }
});