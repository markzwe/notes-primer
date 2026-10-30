import { useCallback, useEffect, useState } from 'react';
import { login, register, listBoards } from './studyApi.js';
import CreateBoardForm from './CreateBoardForm.jsx';
import LoginForm from './LoginForm.jsx';
import BoardList from './BoardList.jsx';
import StudyBoardPanel from './StudyBoardPanel.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [boards, setBoards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [boardsBusy, setBoardsBusy] = useState(false);
  const [boardsError, setBoardsError] = useState('');

  const endSession = useCallback((message = '') => {
    setSession(null);
    setBoards([]);
    setSelectedId(null);
    setLoginError(message);
  }, []);

  async function handleLogin(username, password, registering = false) {
    setLoginBusy(true);
    setLoginError('');
    try {
      if (registering) await register(username, password);
      const result = await login(username, password);
      setSession({ token: result.accessToken, user: result.user });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginBusy(false);
    }
  }

  useEffect(() => {
    if (session === null) return;
    const controller = new AbortController();
    setBoardsBusy(true);
    setBoardsError('');
    listBoards(session.token, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setBoards(result.boards);
      setSelectedId(result.boards[0]?.id ?? null);
    }).catch((err) => {
      if (controller.signal.aborted) return;
      if (err.status === 401) {
        endSession('Session expired. Log in again.');
      } else {
        setBoardsError(`Cannot load boards: ${err.message}`);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setBoardsBusy(false);
    });
    return () => controller.abort();
  }, [session, endSession]);

  if (session === null) {
    return <main><h1>Study Board</h1>
      <LoginForm onLogin={handleLogin} busy={loginBusy} error={loginError} />
    </main>;
  }
  const selectedBoard = boards.find((board) => board.id === selectedId);
  return (
    <main>
      <header className="app-header">
        <h1>Study Board</h1>
        <p>Signed in as {session.user.username}</p>
        <button type="button" onClick={() => endSession()}>Log out</button>
      </header>
      {boardsBusy && <p role="status">Loading boards...</p>}
      {boardsError && <p role="alert">{boardsError}</p>}
      <BoardList boards={boards} selectedId={selectedId} onSelect={setSelectedId} />
      {!boardsBusy && <CreateBoardForm token={session.token} onUnauthorized={endSession}
        onCreated={(board) => {
          setBoards((current) => [board, ...current]);
          setSelectedId(board.id);
        }} />}
      {selectedBoard && (
        <StudyBoardPanel key={selectedBoard.id} board={selectedBoard}
          token={session.token} userId={session.user.id} onUnauthorized={endSession} />
      )}
    </main>
  );
}
