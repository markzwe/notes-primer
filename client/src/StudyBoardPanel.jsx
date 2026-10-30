import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { listEntries, postEntry, recoverAllEntries } from './studyApi.js';
import { mergeEntries } from './entryState.js';
import EntryList from './EntryList.jsx';
export default function StudyBoardPanel({ board, token, userId, onUnauthorized }) {
    const [entries, setEntries] = useState([]);
    const [nextBefore, setNextBefore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [socketStatus, setSocketStatus] = useState('connecting');
    const [socketError, setSocketError] = useState('');
    const [text, setText] = useState('');
    const [transport, setTransport] = useState('http');
    const [saving, setSaving] = useState(false);
    const [writeError, setWriteError] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        listEntries(token, board.id, null, controller.signal).then((page) => {
            if (controller.signal.aborted) return;
            setEntries((old) => mergeEntries(old, page.entries));
            setNextBefore(page.nextBefore);
        }).catch((err) => {
            if (controller.signal.aborted) return;
            if (err.status === 401) onUnauthorized('Session expired. Log in again.');
            else setHistoryError(`History unavailable: ${err.message}`);
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => controller.abort();
    }, [board.id, token, onUnauthorized]);

    useEffect(() => {
        const controller = new AbortController();
        const socket = io({ auth: { token }, autoConnect: false });
        socketRef.current = socket;
        let active = true;
        let connectionRun = 0;
        let joinedOnce = false;
        socket.on('study:entry', (entry) => {
            if (active && entry?.boardId === board.id) {
                setEntries((old) => mergeEntries(old, [entry]));
            }
        });
        socket.on('connect', async () => {
            const run = ++connectionRun;
            setSocketStatus('joining');
            setSocketError('');
            try {
                const joined = await socket.timeout(5000)
                    .emitWithAck('study:join', { boardId: board.id });
                if (!active || connectionRun !== run) return;
                if (joined.ok !== true) {
                    setSocketStatus('denied');
                    setSocketError(`Join denied: ${joined.code}`);
                    socket.disconnect();
                    return;
                }
                setSocketStatus('live');
                if (joinedOnce) {
                    const all = await recoverAllEntries(token, board.id, controller.signal);
                    if (!active || connectionRun !== run) return;
                    setEntries((old) => mergeEntries(old, all));
                    setNextBefore(null);
                } else {
                    const page = await listEntries(token, board.id, null, controller.signal);
                    if (!active || connectionRun !== run) return;
                    setEntries((old) => mergeEntries(old, page.entries));
                    setNextBefore(page.nextBefore);
                    joinedOnce = true;
                }
            } catch (err) {
                if (!active || connectionRun !== run) return;
                if (err.status === 401) onUnauthorized('Session expired. Log in again.');
                else setSocketError(`Join or recovery failed: ${err.message}`);
            }
        });
        socket.on('connect_error', (err) => {
            if (!active) return;
            setSocketStatus('offline');
            if (err.message === 'authentication required') {
                onUnauthorized('Session expired or rejected. Log in again.');
            } else {
                setSocketError(`Socket unavailable: ${err.message}`);
            }
        });
        socket.on('disconnect', (reason) => {
            ++connectionRun;
            if (!active) return;
            if (reason === 'io client disconnect') return;
            setSocketStatus('offline');
            if (reason === 'io server disconnect') {
                onUnauthorized('Socket session ended. Log in again.');
            }
        });
        socket.connect();
        return () => {
            active = false;
            controller.abort();
            connectionRun++;
            socket.removeAllListeners();
            socket.disconnect();
            if (socketRef.current === socket) socketRef.current = null;
        };
    }, [board.id, token, onUnauthorized]);
    async function loadOlder() {
        if (loadingOlder || nextBefore === null) return;
        setLoadingOlder(true);
        setHistoryError('');
        try {
            const page = await listEntries(token, board.id, nextBefore);
            setEntries((old) => mergeEntries(old, page.entries));
            setNextBefore(page.nextBefore);
        } catch (err) {
            if (err.status === 401) onUnauthorized('Session expired. Log in again.');
            else setHistoryError(`Older history failed: ${err.message}`);
        } finally {
            setLoadingOlder(false);
        }
    }
    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) return;
        const body = text.trim();
        if (body.length < 1 || body.length > 280) {
            setWriteError('Enter 1-280 characters.');
            return;
        }
        setSaving(true);
        setWriteError('');
        try {
            let entry;
            if (transport === 'socket') {
                const socket = socketRef.current;
                if (!socket?.connected || socketStatus !== 'live') {
                    throw new Error('Join the live board before a socket write.');
                }
                const result = await socket.timeout(5000)
                    .emitWithAck('study:post', { boardId: board.id, body });
                if (result.ok !== true) throw new Error(`Write rejected: ${result.code}`);
                entry = result.entry;
            } else {
                const result = await postEntry(token, board.id, body);
                entry = result.entry;
            }
            setEntries((old) => mergeEntries(old, [entry]));
            setText('');
        } catch (err) {
            if (err.status === 401) onUnauthorized('Session expired. Log in again.');
            else setWriteError(`Cannot save: ${err.message}`);
        } finally {
            setSaving(false);
        }
    }
    return (
        <section aria-label={`${board.title} entries`}>
            <h2>{board.title}</h2>
            <p role="status">Live connection: {socketStatus}</p>
            {socketError && <p role="alert">{socketError}</p>}
            <form onSubmit={handleSubmit}>
                <label htmlFor="entry">New study entry</label>
                <textarea id="entry" value={text} maxLength={280} required
                    onChange={(event) => setText(event.target.value)} />
                <label htmlFor="transport">Send using</label>
                <select id="transport" value={transport}
                    onChange={(event) => setTransport(event.target.value)}>
                    <option value="http">HTTP POST</option>
                    <option value="socket">Socket.IO event</option>
                </select>
                <button type="submit" disabled={saving || (transport === 'socket' && socketStatus !== 'live')}>
                    {saving ? 'Saving...' : 'Save entry'}
                </button>
            </form>
            {writeError && <p role="alert">{writeError}</p>}
            {loading && <p role="status">Loading saved history...</p>}
            {historyError && <p role="alert">{historyError}</p>}
            {!loading && <EntryList entries={entries} userId={userId} />}
            {nextBefore !== null && (
                <button type="button" disabled={loadingOlder || loading}
                    onClick={() => void loadOlder()}>
                    {loadingOlder ? 'Loading...' : 'Load older entries'}
                </button>
            )}
        </section>
    );
}