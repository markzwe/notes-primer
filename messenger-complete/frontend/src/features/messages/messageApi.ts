import { request } from "../../lib/http";
export type Message = {
  id: string;
  conversationId: string;
  sequence: number;
  sender: { id: string; username: string };
  body: string;
  createdAt: string;
};
export type MessagePage = { messages: Message[]; nextBefore: string | null };
export function listMessages(
  token: string,
  conversationId: string,
  before: string | null = null,
  signal?: AbortSignal,
) {
  const cursor = before ? `?before=${encodeURIComponent(before)}` : "";
  return request<MessagePage>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages${cursor}`,
    { token, signal },
  );
}
export async function sendMessage(
  token: string,
  conversationId: string,
  body: string,
) {
  return (
    await request<{ message: Message }>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
      { token, method: "POST", body: { body } },
    )
  ).message;
}
export function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}
