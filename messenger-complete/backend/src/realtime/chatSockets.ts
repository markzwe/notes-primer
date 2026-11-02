import type { Server } from "socket.io";
import { authenticateToken } from "../services/session.service.js";
import { Conversation } from "../models/Conversation.js";
import { userRoom, sessionRoom, conversationRoom } from "./notifications.js";
export function attachChatSockets(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") {
      next(new Error("Authentication required."));
      return;
    }
    authenticateToken(token)
      .then((identity) => {
        socket.data.identity = identity;
        next();
      })
      .catch(() => next(new Error("Authentication required.")));
  });
  io.on("connection", (socket) => {
    const identity = socket.data.identity as Awaited<
      ReturnType<typeof authenticateToken>
    >;
    socket.join(userRoom(identity.userId));
    socket.join(sessionRoom(identity.sessionId));
    const timer = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, identity.expiresAt - Date.now()),
    );
    socket.on("disconnect", () => clearTimeout(timer));
    socket.on("conversation:join", async (payload, ack) => {
      if (typeof ack !== "function") return;
      try {
        await authenticateToken(socket.handshake.auth.token);
        const id = payload?.conversationId;
        if (
          typeof id !== "string" ||
          !/^[0-9a-f]{24}$/i.test(id) ||
          !(await Conversation.exists({
            _id: id,
            participants: identity.userId,
          }))
        ) {
          ack({ ok: false, code: "not_found" });
          return;
        }
        await socket.join(conversationRoom(id));
        ack({ ok: true });
      } catch {
        ack({ ok: false, code: "unauthorized" });
        socket.disconnect(true);
      }
    });
    socket.on("conversation:leave", (payload) => {
      if (typeof payload?.conversationId === "string")
        socket.leave(conversationRoom(payload.conversationId));
    });
    // No message-write event: all message writes use the HTTP API.
  });
}
