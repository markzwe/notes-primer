import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, logoutAccount } from "./authApi";
import type { Session } from "./authApi";
import ConversationPanel from "../conversations/ConversationPanel";
export default function AccountPanel({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(session.accessToken, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setReady(true);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) onLogout();
        else setError("Cannot load your account. Refresh to retry.");
      });
    return () => controller.abort();
  }, [session.accessToken, onLogout]);
  async function logout() {
    setLeaving(true);
    setError("");
    try {
      await logoutAccount(session.accessToken);
      onLogout();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onLogout();
      else setError("Could not log out. Please try again.");
    } finally {
      setLeaving(false);
    }
  }
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            m
          </span>
          <h1>Messenger</h1>
        </div>
        <div className="account">
          <span>@{session.user.username}</span>
          <button
            className="secondary"
            disabled={leaving}
            onClick={() => void logout()}
          >
            {leaving ? "Logging out…" : "Log out"}
          </button>
        </div>
      </header>
      {error && (
        <p className="banner" role="alert">
          {error}
        </p>
      )}
      {ready ? (
        <ConversationPanel
          token={session.accessToken}
          userId={session.user.id}
          onUnauthorized={onLogout}
        />
      ) : (
        <p className="banner" role="status">
          Loading your account…
        </p>
      )}
    </main>
  );
}
