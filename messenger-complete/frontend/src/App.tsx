import { useCallback, useEffect, useState } from "react";
import LoginForm from "./features/auth/LoginForm";
import RegisterForm from "./features/auth/RegisterForm";
import AccountPanel from "./features/auth/AccountPanel";
import type { Session } from "./features/auth/authApi";
import "./App.css";
function restoredSession(): Session | null {
  try {
    const item = JSON.parse(
      sessionStorage.getItem("messenger-session") ?? "null",
    );
    if (
      typeof item?.accessToken === "string" &&
      typeof item?.user?.id === "string" &&
      typeof item?.user?.username === "string" &&
      typeof item?.expiresAt === "string" &&
      Date.parse(item.expiresAt) > Date.now()
    )
      return item;
  } catch {
    /* An absent, invalid, or unavailable browser store starts signed out. */
  }
  return null;
}
export default function App() {
  const [session, setSession] = useState<Session | null>(restoredSession);
  const [screen, setScreen] = useState<"login" | "register">("login");
  const endSession = useCallback(() => {
    setSession(null);
    setScreen("login");
  }, []);
  useEffect(() => {
    try {
      if (session)
        sessionStorage.setItem("messenger-session", JSON.stringify(session));
      else sessionStorage.removeItem("messenger-session");
    } catch {
      /* In-memory login remains available. */
    }
    if (!session) return;
    const timer = setTimeout(
      endSession,
      Math.max(0, Date.parse(session.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session, endSession]);
  if (session)
    return (
      <AccountPanel
        key={session.accessToken}
        session={session}
        onLogout={endSession}
      />
    );
  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            m
          </span>
          <h1>Messenger</h1>
        </div>
        <p className="eyebrow">Small conversations. Real connections.</p>
        <h2>Keep the conversation going.</h2>
        <p>
          Private chats and shared spaces for your people. Simple, saved, and
          always within reach.
        </p>
        <span className="intro-decoration" aria-hidden="true">
          hello.
        </span>
      </section>
      <section className="auth-card">
        {screen === "login" ? (
          <>
            <LoginForm onLogin={setSession} />
            <p className="switch-auth">
              New here?{" "}
              <button
                className="text-button"
                onClick={() => setScreen("register")}
              >
                Create an account
              </button>
            </p>
          </>
        ) : (
          <>
            <RegisterForm />
            <p className="switch-auth">
              Already registered?{" "}
              <button
                className="text-button"
                onClick={() => setScreen("login")}
              >
                Go to login
              </button>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
