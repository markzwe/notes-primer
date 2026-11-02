import { useState } from "react";
import type { FormEvent } from "react";
import { registerAccount } from "./authApi";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const user = await registerAccount(username, password);

      setSuccess(`Account created for ${user.username}. You can now log in.`);
      setUsername("");
      setPassword("");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy}>
      <h2>Create an account</h2>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={32}
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={busy}
        aria-describedby="username-help"
      />
      <small id="username-help">
        Use 3–32 characters, starting with a letter. Letters, numbers, and
        underscores are allowed.
      </small>

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={busy}
        aria-describedby="password-help"
      />
      <small id="password-help">
        Use at least 12 characters, up to 72 UTF-8 bytes.
      </small>

      <button type="submit" disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
      </button>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </form>
  );
}
