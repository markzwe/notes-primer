import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Session } from "../models/Session.js";
// Explicit index initialization for the isolated fresh database. No legacy migration.
export async function initializeDatabase() {
  for (const model of [User, Conversation, Message, Session])
    await model.createIndexes();
}
