import bcrypt from "bcrypt";
import { mongo } from "mongoose";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { signAccessToken } from "../auth/token.js";

type RegistrationErrorCode = "INVALID_INPUT" | "USERNAME_TAKEN";

// Registration error codes let callers handle expected failures consistently.
export class RegistrationError extends Error {
  constructor(
    public readonly code: RegistrationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}
export class LoginError extends Error {
  constructor() {
    super("Invalid username or password.");
    this.name = "LoginError";
  }
}

/** Validates registration data, creates the user, and returns public fields. */
export async function registerUser(rawUsername: unknown, rawPassword: unknown) {
  // Input types
  if (typeof rawUsername !== "string" || typeof rawPassword !== "string") {
    throw new RegistrationError(
      "INVALID_INPUT",
      "Username and password must be strings.",
    );
  }

  // Username normalization
  const username = rawUsername.trim().toLowerCase();

  // Username validation
  if (!/^[a-z][a-z0-9_]{2,31}$/.test(username)) {
    throw new RegistrationError(
      "INVALID_INPUT",
      "Username must be 3–32 characters, start with a letter, and use letters, numbers, or underscores.",
    );
  }

  // Password validation
  if (rawPassword.length < 12 || Buffer.byteLength(rawPassword, "utf8") > 72) {
    throw new RegistrationError(
      "INVALID_INPUT",
      "Password must be at least 12 characters and no more than 72 UTF-8 bytes.",
    );
  }

  // Password hashing
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  try {
    // Save user to database
    const user = await User.create({ username, passwordHash });

    // Return public user fields
    return {
      id: user._id.toString(),
      username: user.username,
    };
  } catch (error: unknown) {
    // Handle duplicate username
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      throw new RegistrationError(
        "USERNAME_TAKEN",
        "Username is already taken.",
      );
    }

    throw error;
  }
}

export async function loginUser(rawUsername: unknown, rawPassword: unknown) {
  if (typeof rawUsername !== "string" || typeof rawPassword !== "string") {
    throw new LoginError();
  }

  const username = rawUsername.trim().toLowerCase();

  if (
    !/^[a-z][a-z0-9_]{2,31}$/.test(username) ||
    rawPassword.length === 0 ||
    Buffer.byteLength(rawPassword, "utf8") > 72
  ) {
    throw new LoginError();
  }

  const user = await User.findOne({ username }).select("+passwordHash");

  if (!user) {
    throw new LoginError();
  }

  const passwordMatches = await bcrypt.compare(rawPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new LoginError();
  }

  const session = await Session.create({
    user: user._id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  return {
    expiresAt: session.expiresAt,
    user: {
      id: user._id.toString(),
      username: user.username,
    },
    accessToken: signAccessToken(user._id.toString(), session.id),
  };
}
