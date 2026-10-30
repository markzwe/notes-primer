import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../auth/token.js';
import { StudyBoard } from '../models/StudyBoard.js';
import { appendStudyEntry, studyBoardRoom } from '../study/appendEntry.js';
const idPattern = /^[0-9a-f]{24}$/i;

export function attachStudySockets(io) {
    // Authenticate each connection before allowing it to receive or send events.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== 'string') {
                throw new Error('missing token');
            }
            const userId = verifyAccessToken(token);
            const claims = jwt.decode(token);
            if (typeof claims?.exp !== 'number') {
                throw new Error('missing expiry');
            }
            socket.data.userId = userId;
            socket.data.expiresAt = claims.exp * 1000;
            next();
        } catch {
            next(new Error('authentication required'));
        }
    });
    io.on('connection', (socket) => {
        // Disconnect when the access token expires so a connection cannot outlive it.
        const remaining = Math.max(0, socket.data.expiresAt - Date.now());
        const expiryTimer = setTimeout(() => {
            socket.disconnect(true);
        }, remaining);
        socket.on('disconnect', () => {
            clearTimeout(expiryTimer);
        });
        socket.on('study:join', async (payload, ack) => {
            // Acknowledgements are optional for clients; validate membership before joining.
            if (typeof ack !== 'function') return;
            const boardId = payload?.boardId;
            if (typeof boardId !== 'string' || !idPattern.test(boardId)) {
                ack({ ok: false, code: 'not_found' });
                return;
            }
            try {
                const board = await StudyBoard.findOne({
                    _id: boardId,
                    members: socket.data.userId
                }).select('_id').lean();
                if (board === null) {
                    ack({ ok: false, code: 'not_found' });
                    return;
                }
                await socket.join(studyBoardRoom(boardId));
                ack({ ok: true, boardId });
            } catch {
                ack({ ok: false, code: 'server_error' });
            }
        });
        socket.on('study:post', async (payload, ack) => {
            if (typeof ack !== 'function') return;
            try {
                // Reuse the shared entry helper so socket and HTTP posts follow the same rules.
                const result = await appendStudyEntry(
                    payload?.boardId,
                    socket.data.userId,
                    payload?.body
                );
                if (result.ok === false) {
                    ack(result);
                    return;
                }
                ack({ ok: true, entry: result.entry });
                // Broadcast only after the entry has been persisted successfully.
                io.to(studyBoardRoom(result.entry.boardId))
                    .emit('study:entry', result.entry);
            } catch {
                ack({ ok: false, code: 'server_error' });
            }
        });
        socket.on('study:leave', (payload, ack) => {
            // Leave only the room matching a well-formed board ID.
            const boardId = payload?.boardId;
            if (typeof boardId !== 'string' || !idPattern.test(boardId)) {
                if (typeof ack === 'function') {
                    ack({ ok: false, code: 'not_found' });
                }
                return;
            }
            socket.leave(studyBoardRoom(boardId));
            if (typeof ack === 'function') {
                ack({ ok: true });
            }
        });
    });
}
