import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../lib/http";
import { createGroup } from "./conversationApi";
import type { Conversation } from "./conversationApi";
type Props = {
  token: string;
  onOpened: (item: Conversation) => void;
  onUnauthorized: () => void;
};
export default function CreateGroupForm({
  token,
  onOpened,
  onUnauthorized,
}: Props) {
  const [title, setTitle] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const item = await createGroup(
        token,
        title,
        names
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
      );
      onOpened(item);
      setTitle("");
      setNames("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onUnauthorized();
      else
        setError(
          error instanceof Error ? error.message : "Cannot create group.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor="group-title">Group name</label>
      <input
        id="group-title"
        required
        maxLength={80}
        value={title}
        disabled={busy}
        onChange={(event) => setTitle(event.target.value)}
      />
      <label htmlFor="group-members">Usernames</label>
      <input
        id="group-members"
        required
        value={names}
        disabled={busy}
        onChange={(event) => setNames(event.target.value)}
        aria-describedby="group-help"
      />
      <small id="group-help">
        Invite 2–19 other registered users, separated by commas. Membership is
        fixed after creation.
      </small>
      <button disabled={busy}>{busy ? "Creating…" : "Create group"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
