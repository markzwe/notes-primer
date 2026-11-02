import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { ApiError } from "../../lib/http";
import type { Conversation } from "../conversations/conversationApi";
import { listMessages, mergeMessages } from "./messageApi";
import type { Message } from "./messageApi";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
type Props = {
  conversation: Conversation;
  token: string;
  userId: string;
  socket: Socket;
  onUnauthorized: () => void;
};
export default function MessagePanel({
  conversation,
  token,
  userId,
  socket,
  onUnauthorized,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [before, setBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [olderBusy, setOlderBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let busy = false;
    let pendingFull = false;
    let connectedOnce = false;
    function fail(error: unknown) {
      if (!active || controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) onUnauthorized();
      else
        setError(
          error instanceof Error ? error.message : "History unavailable.",
        );
    }
    async function recover(full: boolean) {
      if (!active) return;
      if (busy) {
        pendingFull ||= full;
        return;
      }
      busy = true;
      try {
        const first = await listMessages(
          token,
          conversation.id,
          null,
          controller.signal,
        );
        let recovered = first.messages;
        let cursor = first.nextBefore;
        if (full) {
          while (cursor !== null) {
            const page = await listMessages(
              token,
              conversation.id,
              cursor,
              controller.signal,
            );
            recovered = [...page.messages, ...recovered];
            cursor = page.nextBefore;
          }
        }
        if (!active) return;
        setMessages((current) => mergeMessages(current, recovered));
        setBefore(full ? null : first.nextBefore);
        setError("");
      } catch (error) {
        fail(error);
      } finally {
        busy = false;
        if (active) setLoading(false);
        if (pendingFull && active) {
          pendingFull = false;
          void recover(true);
        }
      }
    }
    function received(message: Message) {
      if (active && message.conversationId === conversation.id)
        setMessages((current) => mergeMessages(current, [message]));
    }
    function connected() {
      const full = connectedOnce;
      connectedOnce = true;
      socket
        .timeout(5000)
        .emit(
          "conversation:join",
          { conversationId: conversation.id },
          (error: Error | null, result: { ok: boolean; code?: string }) => {
            if (!active || error) return;
            if (!result.ok) {
              setError("Conversation subscription denied.");
              return;
            }
            void recover(full);
          },
        );
    }
    socket.on("message:new", received);
    socket.on("connect", connected);
    queueMicrotask(() => {
      void recover(refresh > 0);
      if (socket.connected) connected();
    });
    return () => {
      active = false;
      controller.abort();
      socket.off("message:new", received);
      socket.off("connect", connected);
      if (socket.connected)
        socket.emit("conversation:leave", { conversationId: conversation.id });
    };
  }, [conversation.id, token, socket, onUnauthorized, refresh]);
  async function loadOlder() {
    if (!before || olderBusy) return;
    setOlderBusy(true);
    try {
      const page = await listMessages(token, conversation.id, before);
      setMessages((current) => mergeMessages(current, page.messages));
      setBefore(page.nextBefore);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onUnauthorized();
      else
        setError(
          error instanceof Error ? error.message : "Cannot load history.",
        );
    } finally {
      setOlderBusy(false);
    }
  }
  return (
    <section
      className="chat"
      aria-label={`Conversation with ${conversation.title}`}
    >
      <header className="chat-header">
        <div>
          <p className="eyebrow">
            {conversation.kind === "group"
              ? "Group conversation"
              : "Private conversation"}
          </p>
          <h2>{conversation.title}</h2>
          <small>
            {conversation.participants.map((user) => user.username).join(", ")}
          </small>
        </div>
        <button
          className="secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          Refresh messages
        </button>
      </header>
      <div className="history">
        {loading && <p role="status">Loading messages…</p>}
        {error && <p role="alert">{error}</p>}
        {before && (
          <button
            className="secondary"
            disabled={olderBusy}
            onClick={() => void loadOlder()}
          >
            {olderBusy ? "Loading…" : "Load older messages"}
          </button>
        )}
        <MessageList messages={messages} userId={userId} />
      </div>
      <MessageComposer
        token={token}
        conversationId={conversation.id}
        onUnauthorized={onUnauthorized}
        onSent={(message) =>
          setMessages((current) => mergeMessages(current, [message]))
        }
      />
    </section>
  );
}
