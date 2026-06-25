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
```

### Environment files

The app loads env vars based on `NODE_ENV`:

| File              | Used when                            |
| ----------------- | ------------------------------------ |
| `.env`            | `NODE_ENV` is unset or `development` |
| `.env.production` | `NODE_ENV=production`                |

Create your local dev file:

```bash
cp .env.example .env
```

Required variables:

| Variable                    | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| `PORT`                      | Port the API listens on (default `3001`)                |
| `NODE_ENV`                  | `development` or `production`                           |
| `CORS_ORIGIN`               | Comma-separated allowed origins                         |
| `SUPABASE_URL`              | Supabase project API URL                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, never expose to clients) |
| `DB_HOST`                   | Postgres host                                           |
| `DB_PORT`                   | Postgres port                                           |
| `DB_NAME`                   | Database name                                           |
| `DB_USERNAME`               | Postgres username                                       |
| `DB_PASSWORD`               | Postgres password                                       |

### Supabase local dev

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link to the remote project
#    Find <project-ref> in your Supabase dashboard URL: supabase.com/dashboard/project/<project-ref>
npx supabase link
# 3. Configure local settings in supabase/config.toml (ports, auth, storage, etc.)

# 4. Start the local stack
npx supabase start
```

After start, local services run at:

| Service | URL                                                       |
| ------- | --------------------------------------------------------- |
| API     | `http://127.0.0.1:54321`                                  |
| Studio  | `http://127.0.0.1:54323`                                  |
| DB      | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

```bash
npx supabase stop   # when done
```

## Routes

| Method | Path     | Auth | Description                 |
| ------ | -------- | ---- | --------------------------- |
| GET    | /        | No   | Hello World                 |
| GET    | /health  | No   | Health check                |
| GET    | /auth/me | Yes  | Current user (Bearer token) |

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
