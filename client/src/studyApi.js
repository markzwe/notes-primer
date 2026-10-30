export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}
async function requestJson(path, { token, method = 'GET', body, signal } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let response;
    try {
        response = await fetch(path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal
        });
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        throw new ApiError('Cannot reach the API', 0);
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new ApiError(`Invalid API JSON (HTTP ${response.status})`, response.status);
    }
    if (!response.ok) {
        throw new ApiError(data.error ?? `HTTP ${response.status}`, response.status);
    }
    return data;
}
export function login(username, password) {
    return requestJson('/api/auth/login', {
        method: 'POST', body: { username, password }
    });
}
export function register(username, password) {
    return requestJson('/api/auth/register', {
        method: 'POST', body: { username, password }
    });
}
export function createBoard(token, title, invitees) {
    return requestJson('/api/study/boards', {
        token, method: 'POST', body: { title, invitees }
    });
}
export function listBoards(token, signal) {
    return requestJson('/api/study/boards', { token, signal });
}
export function listEntries(token, boardId, before = null, signal) {
    const base = `/api/study/boards/${encodeURIComponent(boardId)}/entries`;
    const cursor = before === null ? '' : `?before=${encodeURIComponent(before)}`;
    return requestJson(base + cursor, { token, signal });
}
export function postEntry(token, boardId, body) {
    return requestJson(`/api/study/boards/${encodeURIComponent(boardId)}/entries`, {
        token, method: 'POST', body: { body }
    });
}
export async function recoverAllEntries(token, boardId, signal) {
    const entries = [];
    let before = null;
    do {
        const page = await listEntries(token, boardId, before, signal);
        entries.push(...page.entries);
        before = page.nextBefore;
    } while (before !== null);
    return entries;
}
