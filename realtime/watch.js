import { io } from 'socket.io-client';
const token = process.env.TOKEN;
const boardId = process.env.BOARD_ID;

if (!token || !boardId) throw new Error('Set TOKEN and BOARD_ID');
const seen = new Set();

function display(entry, source) {
    if (seen.has(entry.id)) return;
    seen.add(entry.id);
    console.log(`${source}: ${entry.body} (${entry.id})`);
}
const socket = io('http://127.0.0.1:3000', {
    auth: { token }
});
socket.on('study:entry', (entry) => {
    if (entry?.boardId === boardId) display(entry, 'live');
});
socket.on('connect_error', (err) => {
    console.error(`Connection rejected: ${err.message}`);
});
socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${reason}`);
});

async function recoverHistory() {
    const collected = [];
    let before = null;
    do {
        const url = new URL(
            `http://127.0.0.1:3000/api/study/boards/${boardId}/entries`
        );
        if (before !== null) url.searchParams.set('before', before);
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`History HTTP ${response.status}`);
        const page = await response.json();
        collected.push(...page.entries);
        before = page.nextBefore;
    } while (before !== null);
    for (const entry of collected.reverse()) display(entry, 'history');
}
socket.on('connect', async () => {
    try {
        const joined = await socket.timeout(5000)
            .emitWithAck('study:join', { boardId });
        if (joined.ok === false) {
            console.error(`Join denied: ${joined.code}`);
            socket.disconnect();
            return;
        }
        console.log('Joined the authorized board');
        await recoverHistory();
    } catch (err) {
        console.error(`Join or history failed: ${err.message}`);
    }
});
