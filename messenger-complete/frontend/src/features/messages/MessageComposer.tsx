import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../lib/http";
import { sendMessage } from "./messageApi";
import type { Message } from "./messageApi";
type Props = {
  token: string;
  conversationId: string;
  onSent: (message: Message) => void;
  onUnauthorized: () => void;
};
export default function MessageComposer({
  token,
  conversationId,
  onSent,
  onUnauthorized,
}: Props) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!body.trim()) {
      setError("Enter a message.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const message = await sendMessage(token, conversationId, body);
      onSent(message);
      setBody("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onUnauthorized();
      else
        setError(
          error instanceof Error ? error.message : "Cannot send message.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="composer" onSubmit={submit} aria-busy={busy}>
      <label htmlFor="message-body">Your message</label>
      <textarea
        id="message-body"
        placeholder="Write a message…"
        required
        maxLength={280}
        value={body}
        disabled={busy}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="composer-actions">
        <small>{body.length}/280</small>
        <button disabled={busy || !body.trim()}>
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
