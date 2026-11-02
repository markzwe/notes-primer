import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../lib/http";
import StartConversationForm from "./StartConversationForm";
import CreateGroupForm from "./CreateGroupForm";
import ConversationList from "./ConversationList";
import { listConversations } from "./conversationApi";
import type { Conversation } from "./conversationApi";
import { useLiveMessages } from "../messages/useLiveMessages";
import MessagePanel from "../messages/MessagePanel";
import type { Message } from "../messages/messageApi";
type Props = { token: string; userId: string; onUnauthorized: () => void };
export default function ConversationPanel({
  token,
  userId,
  onUnauthorized,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { socket, status } = useLiveMessages(token, onUnauthorized);
  const reload = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const loaded = await listConversations(token, signal);
        if (signal?.aborted) return;
        setConversations((current) => [
          ...new Map(
            [...loaded, ...current].map((item) => [item.id, item]),
          ).values(),
        ]);
        setSelectedId((current) => current ?? loaded[0]?.id ?? null);
        setError("");
      } catch (error) {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 401) onUnauthorized();
        else
          setError(
            error instanceof Error
              ? error.message
              : "Cannot load conversations.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [token, onUnauthorized],
  );
  useEffect(() => {
    const controller = new AbortController();
    const changed = () => {
      void reload(controller.signal);
    };
    socket.on("connect", changed);
    socket.on("conversations:changed", changed);
    void reload(controller.signal);
    return () => {
      controller.abort();
      socket.off("connect", changed);
      socket.off("conversations:changed", changed);
    };
  }, [reload, socket]);
  useEffect(() => {
    function message(message: Message) {
      if (message.conversationId !== selectedId)
        setNotice(
          `New message from ${message.sender.username}. Select their conversation to read it.`,
        );
    }
    socket.on("message:new", message);
    return () => {
      socket.off("message:new", message);
    };
  }, [socket, selectedId]);
  function opened(item: Conversation) {
    setConversations((current) => [
      item,
      ...current.filter((old) => old.id !== item.id),
    ]);
    setSelectedId(item.id);
  }
  const selected = conversations.find((item) => item.id === selectedId);
  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-heading">
          <h2>Conversations</h2>
          <button className="secondary" onClick={() => void reload()}>
            Refresh
          </button>
        </div>
        <p
          className={status === "Live" ? "connection live" : "connection"}
          role="status"
        >
          ● {status}
        </p>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {loading && <p role="status">Loading conversations…</p>}
        {error && <p role="alert">{error}</p>}
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setNotice("");
          }}
        />
        <details>
          <summary>New private conversation</summary>
          <StartConversationForm
            token={token}
            onOpened={opened}
            onUnauthorized={onUnauthorized}
          />
        </details>
        <details>
          <summary>Create a group</summary>
          <CreateGroupForm
            token={token}
            onOpened={opened}
            onUnauthorized={onUnauthorized}
          />
        </details>
      </aside>
      {selected ? (
        <MessagePanel
          key={selected.id}
          conversation={selected}
          token={token}
          userId={userId}
          socket={socket}
          onUnauthorized={onUnauthorized}
        />
      ) : (
        <section className="welcome">
          <span className="welcome-icon" aria-hidden="true">
            ↗
          </span>
          <h2>A place to keep in touch.</h2>
          <p>
            Start a private conversation or create a group. Your messages stay
            here when you come back.
          </p>
        </section>
      )}
    </div>
  );
}
