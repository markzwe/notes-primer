import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../auth/authApi";
import { openConversation } from "./conversationApi";
import type { Conversation } from "./conversationApi";

type StartConversationFormProps = {
  token: string;
  onOpened: (conversation: Conversation) => void;
  onUnauthorized: () => void;
};

export default function StartConversationForm({
  token,
  onOpened,
  onUnauthorized,
}: StartConversationFormProps) {
  const [username, setUsername] = useState("");
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
      const conversation = await openConversation(token, username);

      setUsername("");
      onOpened(conversation);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }

      setError(
        error instanceof Error ? error.message : "Cannot open conversation.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy}>
      <h2>Start a conversation</h2>

      <label htmlFor="recipient-username">Username</label>
      <input
        id="recipient-username"
        name="username"
        required
        minLength={3}
        maxLength={32}
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={busy}
      />

      <button type="submit" disabled={busy}>
        {busy ? "Opening..." : "Open conversation"}
      </button>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
