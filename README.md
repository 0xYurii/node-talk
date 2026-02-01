# NodeTalk

The social network for developers who read documentation.

## What it is
- Server-rendered social app (EJS) with API-style responses where needed.
- Users can post, like, comment, follow, and chat in real time.
- Authentication via email/password, guest, and GitHub OAuth.

## Features
- Auth: local login/signup, guest login, GitHub OAuth, sessions in Postgres.
- Feed: create posts, view feed, like/unlike, comment.
- Social: follow requests, private profiles, accept/reject requests.
- Chat: 1:1 conversations + real-time messages via Socket.IO.
- Profile: edit profile, upload avatar to Supabase storage.
- Validation: Zod schemas for params/body/query.

## Tech stack
- Node + Express 5 + TypeScript (CommonJS runtime)
- Prisma (Postgres) + connect-pg-simple (sessions)
- Passport (local + GitHub)
- Socket.IO
- EJS views + CSS
- Supabase storage (avatars)
- Vitest + Supertest

## Project structure
```
.
├── prisma/
│   ├── schema.prisma         # DB schema
│   └── seeds.ts              # Seed script (users, posts, follows, chat)
├── scripts/
│   └── test-db-migrate.js     # Test DB migrate + session table
├── public/
│   └── css/style.css          # App styles
├── src/
│   ├── app.ts                 # Express app + Socket.IO bootstrap
│   ├── config/                # Prisma, sessions, passport, multer, supabase
│   ├── controllers/           # Route handlers (auth, posts, users, chat)
│   ├── middleware/            # Auth, validation, error handling
│   ├── routes/                # Route definitions
│   ├── types/                 # Express type extensions
│   ├── utils/                 # asyncHandler
│   ├── validators/            # Zod schemas
│   └── views/                 # EJS pages + partials + layouts
├── tests/                     # Vitest + Supertest specs
├── generated/                 # Prisma client output (gitignored)
├── tsconfig.json
├── nodemon.json
└── package.json
```

## Key routes (HTML + JSON)
- `GET /` → home (redirects to `/posts` when logged in)
- `GET /health` → health check
- Auth: `/auth/login`, `/auth/signup`, `/auth/logout`, `/auth/guest`, `/auth/github`, `/auth/me`
- Posts: `/posts` (feed), `/posts/:id`, like/comment/delete
- Users: `/users` (discover), `/users/:username`, `/users/requests`, `/users/settings`
- Chat: `/chat` (conversations), `/chat/:id`, `/chat/:id/messages`

## Scripts
- `npm run dev` → run with nodemon + tsx
- `npm test` → migrate test DB + run Vitest
- `npm run test:watch` → watch mode

## Environment variables
Required for full functionality:
- `DATABASE_URL` (Postgres connection string)
- `SESSION_SECRET`
- `CLIENT_URL` (CORS)
- `CORS_ORIGIN`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (optional, default 3000)

Tests use `.env.test` (loaded in `tests/setup.ts`).
