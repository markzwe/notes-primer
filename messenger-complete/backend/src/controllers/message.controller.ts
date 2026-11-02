import { Conversation } from "../models/Conversation.js";
import { notifyParticipants } from "../realtime/notifications.js";
import type { Request, Response, NextFunction } from "express";
import {
  sendMessage,
  listMessages,
  MessageError,
} from "../services/message.service.js";

type MessageRequest = Request<{
  conversationId: string;
}>;

function handleMessageError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof MessageError) {
    const status = error.code === "NOT_FOUND" ? 404 : 400;

    res.status(status).json({ error: error.message });
    return;
  }

  next(error);
}

export async function postMessage(
  req: MessageRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const message = await sendMessage(
      req.params.conversationId,
      req.auth.userId,
      req.body?.body,
    );

    const conversation = await Conversation.findById(
      req.params.conversationId,
    ).select("participants");
    if (conversation)
      notifyParticipants(
        req.app.get("io"),
        conversation.participants.map(String),
        "message:new",
        message,
      );
    res.status(201).json({ message });
  } catch (error: unknown) {
    handleMessageError(error, res, next);
  }
}

export async function getMessages(
  req: MessageRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const page = await listMessages(
      req.params.conversationId,
      req.auth.userId,
      req.query.before,
    );

    res.status(200).json(page);
  } catch (error: unknown) {
    handleMessageError(error, res, next);
  }
}
