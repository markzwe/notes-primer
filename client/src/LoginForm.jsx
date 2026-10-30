import { useState } from 'react';

export default function LoginForm({ onLogin, busy, error }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [registering, setRegistering] = useState(false);

    function handleSubmit(event) {
        // Prevent the default form submission behavior
        event.preventDefault();
        if (busy) return;
        void onLogin(username, password, registering);
    }
    return (
        <form onSubmit={handleSubmit}>
            <h2>{registering ? 'Create an account' : 'Log in to Study Boards'}</h2>
            {registering && <p>Use a 3–32 character username starting with a letter
                (lowercase letters, numbers, and underscores) and a password of at least
                12 characters, up to 72 UTF-8 bytes.</p>}
            <label htmlFor="username">Username</label>
            <input id="username" autoComplete="username" required
                value={username} onChange={(event) => setUsername(event.target.value)} />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required
                value={password} onChange={(event) => setPassword(event.target.value)} />
            <button disabled={busy} type="submit">
                {busy ? 'Please wait...' : registering ? 'Create account' : 'Log in'}
            </button>
            <button type="button" disabled={busy} onClick={() => setRegistering(!registering)}>
                {registering ? 'Use an existing account' : 'Create a new account'}
            </button>
            {error && <p role="alert">{error}</p>}
        </form>
    );
}
