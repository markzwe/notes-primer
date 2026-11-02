import { mongo, type Types } from "mongoose";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
type ErrorCode = "INVALID_INPUT" | "USER_NOT_FOUND" | "SELF_CONVERSATION";
export class ConversationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}
type Participant = { _id: Types.ObjectId; username: string };
type Populated = {
  _id: Types.ObjectId;
  kind: string;
  title: string;
  participants: Participant[];
  createdAt: Date;
};
function view(item: Populated, userId: string) {
  const participants = item.participants
    .filter(Boolean)
    .map((user) => ({ id: String(user._id), username: user.username }));
  const otherUser = participants.find((user) => user.id !== userId);
  return {
    id: String(item._id),
    kind: item.kind,
    title:
      item.kind === "group"
        ? item.title
        : (otherUser?.username ?? "Deleted user"),
    participants,
    otherUser: otherUser ?? null,
    createdAt: item.createdAt,
  };
}
async function conversationView(id: string, userId: string) {
  const item = await Conversation.findOne({
    _id: id,
    participants: userId,
  }).populate<{ participants: Participant[] }>("participants", "_id username");
  if (!item) throw new Error("Conversation unavailable.");
  return view(item, userId);
}
export async function listConversations(userId: string) {
  const items = await Conversation.find({ participants: userId })
    .sort({ createdAt: -1, _id: -1 })
    .populate<{ participants: Participant[] }>("participants", "_id username");
  return items.map((item) => view(item, userId));
}
export async function openDirectConversation(
  userId: string,
  rawUsername: unknown,
) {
  if (
    typeof rawUsername !== "string" ||
    !/^[a-z][a-z0-9_]{2,31}$/.test(rawUsername.trim().toLowerCase())
  )
    throw new ConversationError("INVALID_INPUT", "Enter a valid username.");
  const other = await User.findOne({
    username: rawUsername.trim().toLowerCase(),
  }).select("_id");
  if (!other) throw new ConversationError("USER_NOT_FOUND", "User not found.");
  if (String(other._id) === userId)
    throw new ConversationError("SELF_CONVERSATION", "Choose another user.");
  const participants = [userId, String(other._id)].sort();
  const directKey = participants.join(":");
  let item = await Conversation.findOne({ directKey, kind: "private" });
  if (!item) {
    try {
      item = await Conversation.create({
        kind: "private",
        participants,
        directKey,
      });
    } catch (error) {
      if (!(error instanceof mongo.MongoServerError) || error.code !== 11000)
        throw error;
      item = await Conversation.findOne({ directKey, kind: "private" });
    }
  }
  if (!item) throw new Error("Could not open conversation.");
  return conversationView(String(item._id), userId);
}
export async function createGroup(
  userId: string,
  rawTitle: unknown,
  rawNames: unknown,
) {
  if (
    typeof rawTitle !== "string" ||
    !rawTitle.trim() ||
    rawTitle.trim().length > 80 ||
    !Array.isArray(rawNames) ||
    rawNames.length < 2 ||
    rawNames.length > 19 ||
    rawNames.some((name) => typeof name !== "string")
  )
    throw new ConversationError(
      "INVALID_INPUT",
      "Use a title and 2–19 other usernames.",
    );
  const names = rawNames.map((name: string) => name.trim().toLowerCase());
  if (
    new Set(names).size !== names.length ||
    names.some((name) => !/^[a-z][a-z0-9_]{2,31}$/.test(name))
  )
    throw new ConversationError(
      "INVALID_INPUT",
      "Use distinct, valid usernames.",
    );
  const users = await User.find({ username: { $in: names } }).select("_id");
  if (
    users.length !== names.length ||
    users.some((user) => String(user._id) === userId)
  )
    throw new ConversationError(
      "USER_NOT_FOUND",
      "Invite other registered users; do not include yourself.",
    );
  const item = await Conversation.create({
    kind: "group",
    title: rawTitle.trim(),
    participants: [userId, ...users.map((user) => user._id)],
  });
  return conversationView(String(item._id), userId);
}
