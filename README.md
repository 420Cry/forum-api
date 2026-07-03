# Forum API

NestJS backend for forum-app.

## Project structure

```
src/
├── app/              # App module (imports feature modules)
├── config/           # Env config service (EnvService)
├── database/         # TypeORM data source, migrations, seed
│   └── migrations/
├── filters/          # Global exception filters
├── modules/          # Feature modules (modular structure)
│   ├── auth/         # Supabase Auth, guards, token verification
│   ├── health/
│   ├── root/
│   ├── tags/         # Tag entity + user_tag junction
│   └── users/        # User entity + onboarding flow
│       ├── dto/
│       └── onboarding/
└── main.ts
```

**Flow:**

- **Modular structure** – Each feature lives in its own module (controller, service, tests).
- **DI with tokens** – Services use injection tokens (`ROOT_SERVICE`, `HEALTH_SERVICE`) via `@Inject()` for loose coupling and easier testing.
- **Auth** – Supabase verifies access tokens (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). `@Public()` marks routes as unauthenticated. Protected routes require `Authorization: Bearer <token>`.
- **Database** – TypeORM + Postgres (Supabase). Entities: `User`, `Tag`, and a `user_tag` junction. Schema changes are versioned as migrations under `src/database/migrations` (`synchronize` is off). The `users` table's primary key `supabaseUid` is a FK onto Supabase's `auth.users(id)`.
- **Onboarding** – New users move through a 3-step state machine tracked by `users.onboard_process`: `RoleSelection → GoalSelection → BasicInfo → Completed`. Each `/user/*` endpoint advances one step and rejects out-of-order calls.

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

## Database & migrations

TypeORM is configured in `src/database/dataSource.config.ts` (also used by the running app via `EnvService.getDBConfig`). `synchronize` is off — all schema changes go through migrations in `src/database/migrations`, which are registered explicitly in the data source's `migrations` array.

```bash
# Apply all pending migrations (runs the full chain on a fresh DB)
bun run migration:run

# Revert the last applied migration
bun run migration:revert

# Generate a migration from entity changes (NAME=MyChange)
NAME=MyChange bun run migration:generate

# Create an empty migration (MIGRATION_NAME=MyChange)
MIGRATION_NAME=MyChange bun run migration:create

# Seed local data
bun run seed
```

> On a fresh Supabase DB, `migration:run` creates the `migrations` bookkeeping table, then applies every migration in timestamp order. Never edit or delete a migration that has already run on a shared DB — add a new one instead.

## Routes

| Method | Path        | Auth | Description                                              |
| ------ | ----------- | ---- | ------------------------------------------------------- |
| GET    | /           | No   | Hello World                                             |
| GET    | /health     | No   | Health check                                            |
| GET    | /auth/me    | Yes  | Current user (Bearer token)                             |
| POST   | /user/role  | Yes  | Onboarding step 1 – save role (`RoleSelection` → `GoalSelection`) |
| POST   | /user/goals | Yes  | Onboarding step 2 – save goals (`GoalSelection` → `BasicInfo`)    |
| POST   | /user/info  | Yes  | Onboarding step 3 – save profile (`BasicInfo` → `Completed`)      |

### Onboarding request bodies

Each step requires the user to be at the matching `onboard_process` state; calling out of order returns an error.

```jsonc
// POST /user/role
{ "role": "Founder" } // or "Investor"

// POST /user/goals
{ "goals": ["string", ...] } // at least 1

// POST /user/info
{
  "firstName": "Ada",     // ≥2 chars, no special characters
  "lastName": "Lovelace", // ≥2 chars, no special characters
  "age": 30,              // number, 5–100
  "location": "London",   // ≥2 chars, no special characters
  "occupation": "Founder" // ≥2 chars, no special characters
}
```

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
