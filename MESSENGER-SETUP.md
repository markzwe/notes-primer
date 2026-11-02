# Messenger dependency setup

JavaScript uses `package.json` for dependencies instead of Python's
`requirements.txt`. These manifests reuse the versions declared by Notes Primer.
They are starter dependency files; application source has not been moved into
the new folders yet.

## Folder layout

```text
messenger/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   ├── app.js
│   ├── auth/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── realtime/
│   └── study/
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── eslint.config.js
    ├── public/
    └── src/
```

The source files and configuration shown above are the target layout, not files
created by this setup. To reuse Notes Primer, copy the backend source folders,
`server.js`, and `app.js` from the project root into `backend/`, and copy
`client/src/`, `client/public/`, `client/index.html`, `client/vite.config.js`, and
`client/eslint.config.js` into `frontend/`. Copy existing backend tests too if
you want to run them. Keep `study/` until you update its imports as part of the
messenger rename. Do not copy `node_modules/`, `dist/`, or existing secrets.

## Install dependencies

Use Node.js 22.18 or newer. From the folder containing both new directories:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Each installation creates a separate `package-lock.json`; commit both lockfiles
for repeatable dependency installation.

## Configure the backend

```bash
cp backend/.env.example backend/.env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `JWT_SECRET` in `backend/.env.local`. Keep this
file out of version control. The existing root `.gitignore` already ignores
`.env.local` and `node_modules/` in nested folders; preserve those ignore rules
if you create a separate repository.

The example MongoDB URI uses local port 27018, matching this project's
`compose.yaml`. You can reuse that file at the new project root and start
MongoDB with `docker compose up -d`.

## Run after adding the source files

In one terminal:

```bash
cd backend
npm run dev
```

In a second terminal:

```bash
cd frontend
npm run dev
```

The copied Vite configuration proxies `/api` and `/socket.io` to the backend on
port 3000. Open http://127.0.0.1:5173.

The backend `start` command expects environment variables to be supplied by the
deployment environment; `dev` loads `.env.local` for local development.

The backend uses Node's built-in watch mode, so nodemon is unnecessary.
`socket.io-client` belongs in the frontend; the backend only needs it if you
later add command-line socket clients such as `realtime/post.js` or tests that
import that package. In that case, install it with
`npm --prefix backend install --save-dev socket.io-client`.
