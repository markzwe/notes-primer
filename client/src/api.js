// Shared helper for all API calls.
// It runs a fetch request, parses JSON, and throws a readable error if anything fails.
async function requestJson(path, options = {}) {
    let response;
    try {
        response = await fetch(path, options);
    } catch (err) {
        throw new Error(`Network error: ${err.message}`);
    }

    let data;
    try {
        data = await response.json();
    } catch (err) {
        throw new Error(`Invalid JSON response: ${err.message}`);
    }

    if (!response.ok) {
        const errorMessage = data?.error || `HTTP error: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
}

// Fetch all notes from the server.
export function getNotes(signal) {
    return requestJson('/api/examples/notes', { signal });
}

// Create a new note by sending text to the backend in JSON format.
export function createNote(text) {
    return requestJson('/api/examples/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
}

// Perform a login request to the server and return the access token.
export async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok === false) {
        throw new Error(data.error ?? 'Login failed');
    }
    return data.token;
}

export async function loadPrivateNotes(token) {
    const response = await fetch('/api/private/notes', {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok === false) {
        throw new Error(`Private GET failed: ${response.status}`);
    }
    return (await response.json()).notes;
}