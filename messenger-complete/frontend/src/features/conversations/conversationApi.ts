import { request } from "../../lib/http";
export type Conversation = {
  id: string;
  kind: "private" | "group";
  title: string;
  participants: { id: string; username: string }[];
  otherUser: { id: string; username: string } | null;
  createdAt: string;
};
export async function openConversation(token: string, username: string) {
  return (
    await request<{ conversation: Conversation }>("/api/conversations", {
      token,
      method: "POST",
      body: { username },
    })
  ).conversation;
}
export async function createGroup(
  token: string,
  title: string,
  usernames: string[],
) {
  return (
    await request<{ conversation: Conversation }>("/api/conversations/groups", {
      token,
      method: "POST",
      body: { title, usernames },
    })
  ).conversation;
}
export async function listConversations(token: string, signal?: AbortSignal) {
  return (
    await request<{ conversations: Conversation[] }>("/api/conversations", {
      token,
      signal,
    })
  ).conversations;
}
