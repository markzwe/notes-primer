import { Schema, model } from "mongoose";
const schema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 280 },
    sequence: { type: Number, required: true },
  },
  { timestamps: true },
);
schema.index({ conversation: 1, sequence: -1 }, { unique: true });
export const Message = model("Message", schema);
