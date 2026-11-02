import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeMessages,
  type Message,
} from "../../frontend/src/features/messages/messageApi.ts";
test("history, HTTP replies and socket events merge once in server sequence order", () => {
  const message = (id: string, sequence: number): Message => ({
    id,
    sequence,
    conversationId: "chat",
    sender: { id: "alice", username: "alice" },
    body: id,
    createdAt: "2026-01-01T00:00:00Z",
  });
  const original = [message("three", 3), message("one", 1)];
  const result = mergeMessages(original, [
    message("three", 3),
    message("two", 2),
  ]);
  assert.deepEqual(
    result.map((item) => item.id),
    ["one", "two", "three"],
  );
  assert.equal(original.length, 2);
});
