# Forum API

NestJS backend for forum-app.

## Project structure

```
src/
├── app/              # App module (imports feature modules)
├── modules/          # Feature modules (modular structure)
│   ├── auth/         # Supabase Auth, guards, token verification
│   ├── health/
│   └── root/
└── main.ts
```

**Flow:**

- **Modular structure** – Each feature lives in its own module (controller, service, tests).
- **DI with tokens** – Services use injection tokens (`ROOT_SERVICE`, `HEALTH_SERVICE`) via `@Inject()` for loose coupling and easier testing.
- **Auth** – Supabase verifies access tokens (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). `@Public()` marks routes as unauthenticated. Protected routes require `Authorization: Bearer <token>`.
- **Database** – None yet. Forum data will be added later (Supabase Postgres or another store).

## Setup

```bash
bun install
cp .env.example .env
```

Set in `.env`:

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server only)
- `CORS_ORIGIN` — comma-separated origins (e.g. `http://app.forum.test,http://localhost:3000`)

## Routes

| Method | Path     | Auth | Description              |
|--------|----------|------|--------------------------|
| GET    | /        | No   | Hello World              |
| GET    | /health  | No   | Health check             |
| GET    | /auth/me | Yes  | Current user (Bearer token) |

`/auth/me` returns `{ id, email }` from the verified Supabase JWT.

## Run

```bash
bun run dev          # development (watch)
bun run start:prod   # production
```

## Tests

```bash
bun run test         # unit
bun run test:e2e     # e2e
```

## Lint

```bash
bun run lint       # check
bun run lint:fix   # check and auto-fix
```
