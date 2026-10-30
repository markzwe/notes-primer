# Notes Primer

Study boards built with React, Express, MongoDB, and Socket.IO.

Use Node.js 22.18 or newer and Docker Compose.

1. Install dependencies: `npm install` and `npm --prefix client install`.
2. Create `.env.local` if it does not exist. Set `JWT_SECRET` to a random
   64-character hexadecimal value generated with
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
   Optionally set `MONGODB_URI`; it defaults to
   `mongodb://127.0.0.1:27018/capstone_notes_primer`.
3. Start MongoDB: `docker compose up -d`.
4. Start the API: `npm run dev`.
5. In another terminal, start the frontend: `npm --prefix client run dev`.
6. Open http://127.0.0.1:5173.

The frontend proxies both API requests and Socket.IO connections to port 3000.
Log in with an existing account or choose **Create a new account**. Passwords
must contain at least 12 characters (up to 72 UTF-8 bytes). Use **Create a shared
board** after logging in. Invitees must already be registered; each board
requires one or two other users. For a fresh database, create a second account
before creating a board.

Run `npm test` for tests (no database or existing server required),
`npm --prefix client run lint` for lint, and
`npm --prefix client run build` for a production frontend build.
