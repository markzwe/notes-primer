import type { Server } from "socket.io";
export const userRoom = (id: string) => `user:${id}`;
export const sessionRoom = (id: string) => `session:${id}`;
export const conversationRoom = (id: string) => `conversation:${id}`;
export function notifyParticipants(
  io: Server | undefined,
  ids: string[],
  event: string,
  payload: unknown,
) {
  io?.to(ids.map(userRoom)).emit(event, payload);
}
