import { useState } from 'react';
import { createBoard } from './studyApi.js';

export default function CreateBoardForm({ token, onCreated, onUnauthorized }) {
  const [title, setTitle] = useState('');
  const [invitees, setInvitees] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const names = invitees.split(',').map((name) => name.trim()).filter(Boolean);
    if (!title.trim() || names.length < 1 || names.length > 2) {
      setError('Enter a title and one or two usernames separated by a comma.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await createBoard(token, title, names);
      onCreated(result.board);
      setTitle('');
      setInvitees('');
    } catch (err) {
      if (err.status === 401) onUnauthorized('Session expired. Log in again.');
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={handleSubmit}>
    <h2>Create a shared board</h2>
    <label htmlFor="board-title">Board title</label>
    <input id="board-title" value={title} maxLength={80} required
      onChange={(event) => setTitle(event.target.value)} />
    <label htmlFor="board-invitees">Invite usernames</label>
    <input id="board-invitees" value={invitees} required aria-describedby="invite-help"
      onChange={(event) => setInvitees(event.target.value)} />
    <p id="invite-help">Invite one or two other registered users, separated by a comma.</p>
    <button disabled={busy} type="submit">{busy ? 'Creating...' : 'Create board'}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
