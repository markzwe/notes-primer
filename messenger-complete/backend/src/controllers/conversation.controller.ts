import type { Request, Response, NextFunction } from "express";
import {
  openDirectConversation,
  createGroup,
  listConversations,
  ConversationError,
} from "../services/conversation.service.js";
import { notifyParticipants } from "../realtime/notifications.js";
function fail(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ConversationError)
    res
      .status(error.code === "USER_NOT_FOUND" ? 404 : 400)
      .json({ error: error.message });
  else next(error);
}
export async function openConversation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth) {
    res.sendStatus(401);
    return;
  }
  try {
    const conversation = await openDirectConversation(
      req.auth.userId,
      req.body?.username,
    );
    notifyParticipants(
      req.app.get("io"),
      conversation.participants.map((user) => user.id),
      "conversations:changed",
      {},
    );
    res.json({ conversation });
  } catch (error) {
    fail(error, res, next);
  }
}
export async function postGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth) {
    res.sendStatus(401);
    return;
  }
  try {
    const conversation = await createGroup(
      req.auth.userId,
      req.body?.title,
      req.body?.usernames,
    );
    notifyParticipants(
      req.app.get("io"),
      conversation.participants.map((user) => user.id),
      "conversations:changed",
      {},
    );
    res.status(201).json({ conversation });
  } catch (error) {
    fail(error, res, next);
  }
}
export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth) {
    res.sendStatus(401);
    return;
  }
  try {
    res.json({ conversations: await listConversations(req.auth.userId) });
  } catch (error) {
    next(error);
  }
}
