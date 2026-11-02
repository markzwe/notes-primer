import type { Message } from "./messageApi";
export default function MessageList({
  messages,
  userId,
}: {
  messages: Message[];
  userId: string;
}) {
  if (!messages.length)
    return (
      <p className="empty-note">Say hello. Messages you send here are saved.</p>
    );
  return (
    <ol className="message-list" aria-label="Messages">
      {messages.map((message) => (
        <li
          className={message.sender.id === userId ? "message own" : "message"}
          key={message.id}
        >
          <div className="message-meta">
            <strong>
              {message.sender.id === userId ? "You" : message.sender.username}
            </strong>
            <time dateTime={message.createdAt}>
              {new Date(message.createdAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
          <p>{message.body}</p>
        </li>
      ))}
    </ol>
  );
}
