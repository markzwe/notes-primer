import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET ?? "";
if (!/^[0-9a-f]{64}$/i.test(secret))
  throw new Error("JWT_SECRET must be 64 hexadecimal characters");
const settings = {
  algorithm: "HS256" as const,
  issuer: "messenger",
  audience: "messenger-api",
};
export function signAccessToken(userId: string, sessionId: string): string {
  return jwt.sign({}, secret, {
    ...settings,
    subject: userId,
    jwtid: sessionId,
    expiresIn: "15m",
  });
}
export function verifyAccessToken(token: string) {
  const claims = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: settings.issuer,
    audience: settings.audience,
  });
  if (
    typeof claims === "string" ||
    typeof claims.sub !== "string" ||
    !/^[0-9a-f]{24}$/i.test(claims.sub) ||
    typeof claims.jti !== "string" ||
    !/^[0-9a-f]{24}$/i.test(claims.jti) ||
    typeof claims.exp !== "number"
  )
    throw new Error("Invalid token claims");
  return {
    userId: claims.sub,
    sessionId: claims.jti,
    expiresAt: claims.exp * 1000,
  };
}
