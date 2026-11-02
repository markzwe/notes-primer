# Messenger

A complete local TypeScript messenger with React, Express, MongoDB and Socket.IO.
Message writes and saved-history reads use HTTP. Socket.IO delivers notifications;
there is no socket message-writing endpoint.

## Run

Use Node.js 22.18 or newer, npm, and Docker Desktop (or an existing local MongoDB).

From this folder:

```bash
npm --prefix backend install
npm --prefix frontend install
npm run setup
docker compose up -d
```

`setup` generates a new JWT secret in `backend/.env.local`. It preserves an
existing environment file. The supplied Docker service uses port 27020 and its
own volume. The database is named `messenger_complete`.

For this prepared preview, `.env.local` already points at the existing local
MongoDB on port 27019, using a separate `messenger_complete` database. You can
run it without starting another MongoDB container. Your original project's
`messenger` database is not migrated or modified.

Start two terminals from this folder:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Open http://127.0.0.1:5175. The API runs on http://127.0.0.1:3002.
These ports avoid the original project's 3001/5174. If you change the backend
port, update the proxy in `frontend/vite.config.ts` too.

Register two accounts for private chats, or three for a group. Usernames are
3–32 characters, start with a letter, and allow letters, numbers and underscores.
Passwords require at least 12 characters and at most 72 UTF-8 bytes. Group names
are 1–80 characters, with 2–19 other registered users. Membership is fixed.
Messages contain 1–280 characters after trimming.

Synthetic browser-verification accounts in the prepared preview database are
`preview_alice`, `preview_bob`, and `preview_carol`, with the test-only password
`Preview-password-2026!`. Fresh databases contain no predefined accounts.

## Features

- Registration, login, per-session logout and 15-minute expiry.
- Sessions survive page refresh in the same tab; the server verifies every
  protected HTTP request against its active session record.
- Logout revokes that session and disconnects its sockets. Other sessions for
  the same user remain active. Signed tokens alone are insufficient after logout.
- Private conversations are unique per pair, including concurrent creation.
- Named groups have fixed membership; no membership-edit endpoint exists.
- Messages are persisted before delivery, with sender username and server time.
- A per-conversation atomic sequence gives concurrent messages a stable order.
  Failed inserts can leave gaps; gaps do not affect ordering or pagination.
- Latest 20 messages on opening, older-message pagination, and manual refresh.
- Live delivery, message deduplication, connection status and HTTP history
  recovery after reconnection. HTTP sending also works while sockets are offline.
- Drafts remain in the composer if a send fails. Switching conversations starts
  a new composer.
- Participant-only access is checked on message reads, writes and socket joins.
- Responsive layout and keyboard-accessible forms.

## Check

```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix frontend run lint
npm run build
```

Integration tests need a local MongoDB. They read the local MongoDB connection
setting but always override the database name with a random `messenger_test_…`
name, and delete only that generated test database afterward. Override the server
address with `TEST_MONGODB_URI` if needed.

The suite covers validation, hashes, expired/tampered tokens, simultaneous chat
creation, groups, nonparticipant rejection, HTTP sends, pagination, socket
notifications, session revocation, persistence across reconnection, and merging
HTTP/history/live copies without duplicates. It also measures 100 history API
requests with five concurrent clients against a 100-message conversation. This
measurement excludes browser rendering; it is not a full browser performance
acceptance test.

Manual browser checks: register, log in, open a chat, send text, receive a live
reply, create a group, refresh and verify saved messages, and log out.

## File flow

Startup:

```text
backend/src/server.ts
  → config/database.ts: connectDatabase()
  → config/initializeDatabase.ts: create indexes
  → create HTTP server + Socket.IO
  → realtime/chatSockets.ts: attachChatSockets()
  → listen
```

Send a message:

```text
MessageComposer.tsx
  → messageApi.ts: sendMessage()
  → POST /api/conversations/:conversationId/messages
  → app.ts → conversation.routes.ts → requireAuth.ts
  → session.service.ts verifies JWT and active server session
  → message.routes.ts → message.controller.ts: postMessage()
  → message.service.ts: membership, validation, sequence allocation, save
  → models/Message.ts → MongoDB
  → realtime/notifications.ts broadcasts message:new to participant user rooms
  → HTTP 201 returns the saved message
  → MessagePanel merges by message ID and orders by sequence
```

Live delivery uses authenticated user rooms, so a participant can receive a
notification for an unopened conversation. Explicit conversation joins also
verify membership. Connection expiry and logout disconnect the session.

Recover history:

```text
MessagePanel.tsx
  → messageApi.ts: listMessages()
  → getMessages() → listMessages() → membership check → MongoDB
  → populate sender names → chronological page + nextBefore cursor
```

The first connection loads the newest page; reconnecting recovers all pages and
merges them with existing messages. There is one socket per signed-in workspace.

## Original project and data

This is an isolated completed version prepared from the original source.
`cps490-26f-htetz1` and its database have not been rewritten. The new conversation
schema and message sequence field require an explicit migration before using an
old database. Do not point this build at the old database without that work.
No migration or legacy-index deletion is run by this version.

Use the separate database for immediate review. Applying the completed files to
the original repository remains a separate approval step; review
`CHANGE-SUMMARY.md` first.
