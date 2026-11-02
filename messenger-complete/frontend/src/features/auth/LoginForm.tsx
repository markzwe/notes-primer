import { useState } from "react";
import type { FormEvent } from "react";
import { loginAccount } from "./authApi";
import type { Session } from "./authApi";

type LoginFormProps = {
  onLogin: (session: Session) => void;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const session = await loginAccount(username, password);

      setPassword("");
      onLogin(session);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy}>
      <h2>Log in</h2>

      <label htmlFor="login-username">Username</label>
      <input
        id="login-username"
        name="username"
        autoComplete="username"
        required
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={busy}
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={busy}
      />

      <button type="submit" disabled={busy}>
        {busy ? "Logging in..." : "Log in"}
      </button>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
