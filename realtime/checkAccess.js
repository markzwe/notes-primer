import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
const token = process.env.TOKEN;
const boardId = process.env.BOARD_ID;
if (!token || !boardId) throw new Error('Set TOKEN and BOARD_ID');
const socket = io('http://127.0.0.1:3000', {
    auth: { token }, reconnection: false
});
socket.on('connect_error', (err) => {
    console.error(`Connection failed: ${err.message}`);
    process.exitCode = 1;
});
socket.on('connect', async () => {
    try {
        const joined = await socket.timeout(5000)
            .emitWithAck('study:join', { boardId });
        const posted = await socket.timeout(5000).emitWithAck('study:post', {
            boardId, body: 'Carol must not write here'
        });
        assert.deepEqual(joined, { ok: false, code: 'not_found' });
        assert.deepEqual(posted, { ok: false, code: 'not_found' });
        console.log('PASS: nonmember join and write denied');
    } catch (err) {
        console.error(`FAIL: ${err.message}`);
        process.exitCode = 1;
    } finally {
        socket.disconnect();
    }
});