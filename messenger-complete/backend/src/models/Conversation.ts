import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
const schema = new Schema(
  {
    kind: {
      type: String,
      enum: ["private", "group"],
      default: "private",
      required: true,
    },
    title: { type: String, trim: true, maxlength: 80, default: "" },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      required: true,
      validate: {
        validator: (ids: Types.ObjectId[]) =>
          ids.length >= 2 &&
          ids.length <= 20 &&
          new Set(ids.map(String)).size === ids.length,
        message: "Conversations require 2–20 distinct participants.",
      },
    },
    directKey: String,
    nextSequence: { type: Number, default: 0 },
  },
  { timestamps: true },
);
schema.pre("validate", function () {
  if (this.kind === "private") {
    if (this.participants.length !== 2)
      this.invalidate(
        "participants",
        "Private conversations require two users.",
      );
    this.directKey = this.participants.map(String).sort().join(":");
  } else {
    if (!this.title) this.invalidate("title", "A group title is required.");
    this.directKey = undefined;
  }
});
schema.index(
  { directKey: 1 },
  { unique: true, partialFilterExpression: { kind: "private" } },
);
schema.index({ participants: 1, createdAt: -1, _id: -1 });
export const Conversation = model("Conversation", schema);
