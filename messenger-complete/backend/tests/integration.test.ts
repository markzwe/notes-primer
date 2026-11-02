import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Server } from "socket.io";
import { io as client, type Socket } from "socket.io-client";

process.env.JWT_SECRET = randomBytes(32).toString("hex");
const { default: app } = await import("../src/app.js");
const { attachChatSockets } = await import("../src/realtime/chatSockets.js");
const { initializeDatabase } = await import(
  "../src/config/initializeDatabase.js"
);
const { User } = await import("../src/models/User.js");
const { Conversation } = await import("../src/models/Conversation.js");
const { Message } = await import("../src/models/Message.js");
const { Session } = await import("../src/models/Session.js");

// This suite always uses a newly generated database, never the application's DB.
test("messenger integration", { timeout: 120_000 }, async (t) => {
  const databaseName = `messenger_test_${randomBytes(12).toString("hex")}`;
  await mongoose.connect(
    process.env.TEST_MONGODB_URI ??
      process.env.MONGODB_URI ??
      "mongodb://127.0.0.1:27020",
    { dbName: databaseName, autoIndex: false },
  );
  const server = createServer(app);
  const io = new Server(server);
  app.set("io", io);
  attachChatSockets(io);
  const sockets: Socket[] = [];
  t.after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await new Promise<void>((resolve) => io.close(() => resolve()));
    if (
      mongoose.connection.name === databaseName &&
      /^messenger_test_[a-f0-9]{24}$/.test(databaseName)
    )
      await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await initializeDatabase();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  async function api(
    path: string,
    token?: string,
    body?: unknown,
    expected = 200,
    method?: string,
  ) {
    const response = await fetch(base + path, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = response.status === 204 ? undefined : await response.json();
    assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
    return data;
  }
  const password = "test-password-12345";
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  await t.test(
    "registration, validation, password hashes, login and redaction",
    async () => {
      await api(
        "/api/auth/register",
        undefined,
        { username: "bad", password: "short" },
        400,
      );
      for (const username of ["alice", "bob", "carol", "dave"]) {
        const result = await api(
          "/api/auth/register",
          undefined,
          { username, password },
          201,
        );
        assert.deepEqual(Object.keys(result.user).sort(), ["id", "username"]);
        ids[username] = result.user.id;
        const login = await api("/api/auth/login", undefined, {
          username,
          password,
        });
        assert.ok(login.expiresAt);
        tokens[username] = login.accessToken;
      }
      await api(
        "/api/auth/register",
        undefined,
        { username: " ALICE ", password },
        409,
      );
      await api(
        "/api/auth/login",
        undefined,
        { username: "alice", password: "wrong" },
        401,
      );
      await api("/api/auth/login", undefined, { username: {}, password }, 401);
      await api(
        "/api/auth/register",
        undefined,
        { username: "toolong", password: "🙂".repeat(30) },
        400,
      );
      const user = await User.findById(ids.alice).select("+passwordHash");
      assert.ok(user);
      assert.notEqual(user.passwordHash, password);
      assert.equal(await bcrypt.compare(password, user.passwordHash), true);
      assert.equal((await User.findById(ids.alice))?.passwordHash, undefined);
    },
  );
  await t.test(
    "protected routes reject missing, malformed, tampered and expired tokens",
    async () => {
      await api("/api/auth/me", undefined, undefined, 401);
      await api("/api/auth/me", "invalid", undefined, 401);
      await api(
        "/api/auth/me",
        tokens.alice.slice(0, -8) + "tampered",
        undefined,
        401,
      );
      const claims = jwt.decode(tokens.alice) as jwt.JwtPayload;
      const expired = jwt.sign({}, process.env.JWT_SECRET!, {
        algorithm: "HS256",
        subject: ids.alice,
        jwtid: claims.jti,
        issuer: "messenger",
        audience: "messenger-api",
        expiresIn: -1,
      });
      await api("/api/auth/me", expired, undefined, 401);
      assert.equal((await api("/api/auth/me", tokens.alice)).userId, ids.alice);
    },
  );
  let conversationId: string;
  await t.test(
    "simultaneous private-chat creation returns one conversation and lists only memberships",
    async () => {
      const results = await Promise.all(
        Array.from({ length: 8 }, (_, index) =>
          api("/api/conversations", index % 2 ? tokens.alice : tokens.bob, {
            username: index % 2 ? "bob" : "alice",
          }),
        ),
      );
      conversationId = results[0].conversation.id;
      assert.equal(
        new Set(results.map((result) => result.conversation.id)).size,
        1,
      );
      assert.equal(await Conversation.countDocuments({ kind: "private" }), 1);
      assert.equal(
        (await api("/api/conversations", tokens.alice)).conversations[0].title,
        "bob",
      );
      assert.equal(
        (await api("/api/conversations", tokens.bob)).conversations[0].title,
        "alice",
      );
      assert.equal(
        (await api("/api/conversations", tokens.carol)).conversations.length,
        0,
      );
      await api("/api/conversations", tokens.alice, { username: "alice" }, 400);
      await api(
        "/api/conversations",
        tokens.alice,
        { username: "nobody" },
        404,
      );
    },
  );
  let groupId: string;
  await t.test(
    "named groups have fixed membership and independent unique keys",
    async () => {
      const first = await api(
        "/api/conversations/groups",
        tokens.alice,
        { title: "Study group", usernames: ["bob", "carol"] },
        201,
      );
      groupId = first.conversation.id;
      assert.equal(first.conversation.participants.length, 3);
      await api(
        "/api/conversations/groups",
        tokens.alice,
        { title: "Second group", usernames: ["bob", "carol"] },
        201,
      );
      assert.equal(
        (await api("/api/conversations", tokens.carol)).conversations.length,
        2,
      );
      await api(
        "/api/conversations/groups",
        tokens.alice,
        { title: "Bad", usernames: ["bob", "bob"] },
        400,
      );
      await api(
        "/api/conversations/groups",
        tokens.alice,
        { title: "", usernames: ["bob", "carol"] },
        400,
      );
      await api(
        "/api/conversations/groups",
        tokens.alice,
        { title: "Bad", usernames: ["bob", "alice"] },
        404,
      );
      await api(
        `/api/conversations/${groupId}`,
        tokens.alice,
        { participants: [ids.dave] },
        404,
        "PATCH",
      );
    },
  );
  await t.test(
    "message validation, sender identity and nonparticipant access",
    async () => {
      const path = `/api/conversations/${conversationId}/messages`;
      await api(path, undefined, undefined, 401);
      await api(path, tokens.carol, undefined, 404);
      await api(path, tokens.carol, { body: "intrusion" }, 404);
      for (const body of ["   ", "", 42, "x".repeat(281)])
        await api(path, tokens.alice, { body }, 400);
      const result = await api(
        path,
        tokens.alice,
        { body: " Hello Bob ", sender: ids.carol },
        201,
      );
      assert.equal(result.message.body, "Hello Bob");
      assert.equal(result.message.sender.id, ids.alice);
      assert.equal(result.message.sender.username, "alice");
      await api(
        `/api/conversations/${groupId}/messages`,
        tokens.carol,
        { body: "Group hello" },
        201,
      );
      await api(
        `/api/conversations/${groupId}/messages`,
        tokens.dave,
        undefined,
        404,
      );
    },
  );
  await t.test(
    "stable paginated history and concurrent message ordering",
    async () => {
      const path = `/api/conversations/${conversationId}/messages`;
      await Promise.all(
        Array.from({ length: 27 }, (_, i) =>
          api(path, tokens.alice, { body: `message-${i}` }, 201),
        ),
      );
      const first = await api(path, tokens.bob);
      assert.equal(first.messages.length, 20);
      assert.ok(first.nextBefore);
      const older = await api(`${path}?before=${first.nextBefore}`, tokens.bob);
      const messages = [...older.messages, ...first.messages];
      assert.equal(messages.length, 28);
      assert.equal(new Set(messages.map((item) => item.id)).size, 28);
      assert.deepEqual(
        messages.map((item) => item.sequence),
        Array.from({ length: 28 }, (_, i) => i + 1),
      );
      assert.equal(older.nextBefore, null);
      await api(`${path}?before=invalid`, tokens.bob, undefined, 400);
      const other = await api(
        `/api/conversations/${groupId}/messages`,
        tokens.carol,
      );
      await api(
        `${path}?before=${other.messages[0].id}`,
        tokens.bob,
        undefined,
        400,
      );
    },
  );
  async function connect(token: string) {
    const socket = client(base, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      timeout: 3000,
    });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
    });
    return socket;
  }
  let bobSocket: Socket;
  await t.test(
    "notifications reach participants after persistence, not outsiders; socket writes are absent",
    async () => {
      bobSocket = await connect(tokens.bob);
      const outsider = await connect(tokens.dave);
      assert.deepEqual(
        await bobSocket
          .timeout(2000)
          .emitWithAck("conversation:join", { conversationId }),
        { ok: true },
      );
      assert.deepEqual(
        await outsider
          .timeout(2000)
          .emitWithAck("conversation:join", { conversationId }),
        { ok: false, code: "not_found" },
      );
      let leaked = false;
      outsider.on("message:new", () => {
        leaked = true;
      });
      const event = once(bobSocket, "message:new");
      const saved = await api(
        `/api/conversations/${conversationId}/messages`,
        tokens.alice,
        { body: "Live notification" },
        201,
      );
      const [received] = await event;
      assert.equal(received.id, saved.message.id);
      assert.ok(await Message.exists({ _id: received.id }));
      await assert.rejects(
        bobSocket
          .timeout(150)
          .emitWithAck("message:send", {
            conversationId,
            body: "Must not save",
          }),
      );
      assert.equal(await Message.countDocuments({ body: "Must not save" }), 0);
      assert.equal(leaked, false);
    },
  );
  await t.test(
    "reconnection permits HTTP recovery of missed history without duplicate records",
    async () => {
      bobSocket.disconnect();
      const saved = await api(
        `/api/conversations/${conversationId}/messages`,
        tokens.alice,
        { body: "While Bob was away" },
        201,
      );
      bobSocket.connect();
      await once(bobSocket, "connect");
      const page = await api(
        `/api/conversations/${conversationId}/messages`,
        tokens.bob,
      );
      assert.equal(
        page.messages.filter((item) => item.id === saved.message.id).length,
        1,
      );
    },
  );
  await t.test(
    "logout revokes the token and socket while other sessions remain usable",
    async () => {
      const another = await api("/api/auth/login", undefined, {
        username: "bob",
        password,
      });
      const disconnected = once(bobSocket, "disconnect");
      await api("/api/auth/logout", tokens.bob, {}, 204);
      await disconnected;
      await api("/api/auth/me", tokens.bob, undefined, 401);
      await api(
        `/api/conversations/${conversationId}/messages`,
        tokens.bob,
        undefined,
        401,
      );
      assert.equal(
        (await api("/api/auth/me", another.accessToken)).userId,
        ids.bob,
      );
      const rejected = client(base, {
        auth: { token: tokens.bob },
        reconnection: false,
      });
      sockets.push(rejected);
      const [error] = await once(rejected, "connect_error");
      assert.equal(error.message, "Authentication required.");
    },
  );
  await t.test("socket expires when its JWT expires", async () => {
    const session = await Session.create({
      user: ids.alice,
      expiresAt: new Date(Date.now() + 30_000),
    });
    const token = jwt.sign({}, process.env.JWT_SECRET!, {
      subject: ids.alice,
      jwtid: session.id,
      issuer: "messenger",
      audience: "messenger-api",
      expiresIn: 2,
    });
    const socket = await connect(token);
    const [reason] = await once(socket, "disconnect");
    assert.equal(reason, "io server disconnect");
  });
  await t.test("messages survive a database reconnection", async () => {
    const count = await Message.countDocuments();
    await mongoose.disconnect();
    await mongoose.connect(
      process.env.TEST_MONGODB_URI ??
        process.env.MONGODB_URI ??
        "mongodb://127.0.0.1:27020",
      { dbName: databaseName, autoIndex: false },
    );
    assert.equal(await Message.countDocuments(), count);
    assert.ok(
      (await api(`/api/conversations/${conversationId}/messages`, tokens.alice))
        .messages.length,
    );
  });
  await t.test(
    "malformed JSON and unknown API routes return JSON errors",
    async () => {
      const response = await fetch(base + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken",
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error, "Invalid JSON.");
      await api("/api/missing", undefined, undefined, 404);
    },
  );
  await t.test(
    "100 history requests under five concurrent clients: API latency measurement",
    async () => {
      const existing = await Message.countDocuments({
        conversation: conversationId,
      });
      for (let i = existing; i < 100; i++)
        await api(
          `/api/conversations/${conversationId}/messages`,
          tokens.alice,
          { body: `benchmark-${i}` },
          201,
        );
      const samples: number[] = [];
      await Promise.all(
        Array.from({ length: 5 }, async () => {
          for (let i = 0; i < 20; i++) {
            const start = performance.now();
            await api(
              `/api/conversations/${conversationId}/messages`,
              tokens.alice,
            );
            samples.push(performance.now() - start);
          }
        }),
      );
      samples.sort((a, b) => a - b);
      const p95 = samples[94];
      t.diagnostic(
        `Local API history latency: p95 ${p95.toFixed(1)}ms, 100 requests / 5 concurrent clients. This does not measure browser rendering.`,
      );
      assert.equal(samples.length, 100);
      assert.ok(p95 < 2000, `API p95 exceeded 2 seconds: ${p95}`);
    },
  );
});
