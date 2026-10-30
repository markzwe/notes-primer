import { StudyBoard } from '../models/StudyBoard.js';
import { StudyEntry } from '../models/StudyEntry.js';
import { normalizedBody } from './input.js';

// Keep room names consistent so board updates reach the matching subscribers.
const idPattern = /^[0-9a-f]{24}$/i;
export function studyBoardRoom(boardId) {
    return `study:board:${boardId}`;
}

export async function appendStudyEntry(boardId, userId, rawBody) {
    // Reject malformed IDs before querying, and use the same result for unknown
    // and inaccessible boards so callers cannot distinguish between them.
    if (typeof boardId !== 'string' || !idPattern.test(boardId)) {
        return { ok: false, code: 'not_found' };
    }
    const board = await StudyBoard.findOne({
        _id: boardId, members: userId
    }).select('_id').lean();
    if (board === null) return { ok: false, code: 'not_found' };

    // Validate and normalize the submitted text before saving it.
    const body = normalizedBody(rawBody);
    if (body === null) return { ok: false, code: 'invalid_body' };

    // Persist the entry and return the public API shape without the full document.
    const doc = await StudyEntry.create({
        board: board._id, author: userId, body
    });
    return {
        ok: true,
        entry: {
            id: doc._id.toString(),
            boardId: board._id.toString(),
            authorId: userId.toString(),
            body: doc.body,
            createdAt: doc.createdAt
        }
    };
}