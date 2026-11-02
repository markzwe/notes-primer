import { verifyAccessToken } from "../auth/token.js";
import { Session } from "../models/Session.js";
export class AuthenticationError extends Error {}
export async function authenticateToken(token: string) {
  let identity;
  try {
    identity = verifyAccessToken(token);
  } catch {
    throw new AuthenticationError("Invalid or expired token.");
  }
  const active = await Session.exists({
    _id: identity.sessionId,
    user: identity.userId,
    expiresAt: { $gt: new Date() },
  });
  if (!active)
    throw new AuthenticationError("Session ended. Please log in again.");
  return identity;
}
