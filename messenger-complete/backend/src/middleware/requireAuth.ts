import type { Request, Response, NextFunction } from "express";
import {
  authenticateToken,
  AuthenticationError,
} from "../services/session.service.js";
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "");
  if (!match) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  try {
    req.auth = await authenticateToken(match[1]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ error: error.message });
      return;
    }
    next(error);
    return;
  }
  next();
}
