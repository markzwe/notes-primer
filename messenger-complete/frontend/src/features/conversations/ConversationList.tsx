import type { Conversation } from "./conversationApi";
type Props = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};
export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: Props) {
  if (!conversations.length)
    return (
      <p className="empty-note">
        No conversations yet. Start a chat with another registered user.
      </p>
    );
  return (
    <nav aria-label="Your conversations">
      <ul className="conversation-list">
        {conversations.map((item) => (
          <li key={item.id}>
            <button
              className={
                item.id === selectedId ? "conversation active" : "conversation"
              }
              type="button"
              aria-current={item.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(item.id)}
            >
              <span className="avatar" aria-hidden="true">
                {item.kind === "group"
                  ? "#"
                  : item.title.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.kind === "group"
                    ? `${item.participants.length} members`
                    : "Private conversation"}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
