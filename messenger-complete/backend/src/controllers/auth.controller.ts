import { Session } from "../models/Session.js";
import { sessionRoom } from "../realtime/notifications.js";
import type { Server } from "socket.io";
import type { Request, Response, NextFunction } from "express";
import {
  registerUser,
  RegistrationError,
  loginUser,
  LoginError,
} from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // parse into regirsterUser services for checking
    const user = await registerUser(req.body?.username, req.body?.password);

    res.status(201).json({ user });
  } catch (error: unknown) {
    if (error instanceof RegistrationError) {
      const status = error.code === "USERNAME_TAKEN" ? 409 : 400;

      res.status(status).json({ error: error.message });
      return;
    }

    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginUser(req.body?.username, req.body?.password);

    res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof LoginError) {
      res.status(401).json({ error: error.message });
      return;
    }

    next(error);
  }
}
export function getMe(req: Request, res: Response): void {
  if (!req.auth) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  res.status(200).json({
    userId: req.auth.userId,
  });
}
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    res.sendStatus(401);
    return;
  }
  try {
    await Session.deleteOne({ _id: req.auth.sessionId, user: req.auth.userId });
    const io = req.app.get("io") as Server | undefined;
    io?.in(sessionRoom(req.auth.sessionId)).disconnectSockets(true);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
