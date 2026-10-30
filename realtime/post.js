import { io } from 'socket.io-client';
const token = process.env.TOKEN;
const boardId = process.env.BOARD_ID;
const body = process.env.BODY ?? 'Live study checkpoint';
if (!token || !boardId) throw new Error('Set TOKEN and BOARD_ID');
const socket = io('http://127.0.0.1:3000', {
    auth: { token }, reconnection: false
});
socket.on('connect_error', (err) => {
    console.error(`Connection rejected: ${err.message}`);
    process.exitCode = 1;
});
socket.on('connect', async () => {
    try {
        const result = await socket.timeout(5000).emitWithAck('study:post', {
            boardId, body, author: 'forged-client-value'
        });
        if (result.ok === false) {
            console.error(`Write rejected: ${result.code}`);
            process.exitCode = 1;
        } else {
            console.log(`Saved entry: ${result.entry.id}`);
        }
    } catch (err) {
        console.error(`Acknowledgement missing: ${err.message}`);
        process.exitCode = 1;
    } finally {
        socket.disconnect();
    }
});