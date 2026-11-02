import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import type { Types } from "mongoose";

type MessageErrorCode = "INVALID_INPUT" | "NOT_FOUND";

export class MessageError extends Error {
  constructor(
    public readonly code: MessageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MessageError";
  }
}
type MessageSender = {
  _id: Types.ObjectId;
  username: string;
};

export async function listMessages(
  conversationId: string,
  userId: string,
  rawBefore: unknown,
) {
  await requireMembership(conversationId, userId);

  const query = Message.find({
    conversation: conversationId,
  });

  if (rawBefore !== undefined) {
    if (typeof rawBefore !== "string" || !/^[0-9a-f]{24}$/i.test(rawBefore)) {
      throw new MessageError("INVALID_INPUT", "Invalid history cursor.");
    }

    const anchor = await Message.findOne({
      _id: rawBefore,
      conversation: conversationId,
    });

    if (!anchor) {
      throw new MessageError("INVALID_INPUT", "Invalid history cursor.");
    }

    query.find({ sequence: { $lt: anchor.sequence } });
  }

  const pageSize = 20;

  const documents = await query
    .sort({ sequence: -1 })
    .limit(pageSize + 1)
    .populate<{ sender: MessageSender | null }>("sender", "_id username");

  const page = documents.slice(0, pageSize);
  const oldest = page.at(-1);

  return {
    messages: page
      .map((message) => ({
        id: message._id.toString(),
        conversationId: message.conversation.toString(),
        sender: message.sender
          ? {
              id: message.sender._id.toString(),
              username: message.sender.username,
            }
          : {
              id: "deleted",
              username: "Deleted user",
            },
        sequence: message.sequence,
        body: message.body,
        createdAt: message.createdAt,
      }))
      .reverse(),

    nextBefore:
      documents.length > pageSize && oldest ? oldest._id.toString() : null,
  };
}
async function requireMembership(
  conversationId: string,
  userId: string,
): Promise<void> {
  if (!/^[0-9a-f]{24}$/i.test(conversationId)) {
    throw new MessageError("NOT_FOUND", "Conversation not found.");
  }

  const conversation = await Conversation.exists({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new MessageError("NOT_FOUND", "Conversation not found.");
  }
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  rawBody: unknown,
) {
  await requireMembership(conversationId, userId);

  if (typeof rawBody !== "string") {
    throw new MessageError("INVALID_INPUT", "Enter a message.");
  }

  const body = rawBody.trim();

  if (body.length === 0 || body.length > 280) {
    throw new MessageError(
      "INVALID_INPUT",
      "Messages must contain 1–280 characters.",
    );
  }

  const sender = await User.findById(userId).select("_id username");

  if (!sender) {
    throw new MessageError("NOT_FOUND", "Sender not found.");
  }

  // Atomic per-conversation ordering. A failed insert may leave a harmless gap.
  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, participants: userId },
    { $inc: { nextSequence: 1 } },
    { returnDocument: "after", timestamps: false },
  );
  if (!conversation)
    throw new MessageError("NOT_FOUND", "Conversation not found.");
  const message = await Message.create({
    sequence: conversation.nextSequence,
    conversation: conversationId,
    sender: userId,
    body,
  });

  return {
    id: message._id.toString(),
    conversationId: message.conversation.toString(),
    sender: {
      id: sender._id.toString(),
      username: sender.username,
    },
    sequence: message.sequence,
    body: message.body,
    createdAt: message.createdAt,
  };
}
