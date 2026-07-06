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
│   ├── tags/         # Tag entity + user_tag junction (stable goal keys)
│   └── users/        # User entity + onboarding / profile
│       ├── dto/
│       └── onboarding/
└── main.ts
```

**Flow:**

- **Modular structure** – Each feature lives in its own module (controller, service, tests).
- **DI with tokens** – Services use injection tokens (`ROOT_SERVICE`, `HEALTH_SERVICE`) via `@Inject()` for loose coupling and easier testing.
- **Auth** – Supabase verifies access tokens (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). `@Public()` marks routes as unauthenticated. Protected routes require `Authorization: Bearer <token>`.
- **Database** – TypeORM + Postgres (Supabase). Entities: `User`, `Tag`, and a `user_tag` junction. Schema changes are versioned as migrations under `src/database/migrations` (`synchronize` is off). The `users` table's primary key `supabaseUid` is a FK onto Supabase's `auth.users(id)`.
- **Onboarding** – The client collects role, goals, and profile info across three UI steps, then submits everything in one request. Completion is tracked by `users.onboarded_at` (non-null = onboarded). Goal tags use stable `tags.key` values (e.g. `raise_capital`), not display names.

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

Prefer [forum-server](../forum-server) for the full stack (`forum dev`). For API-only work:

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

# Seed goal tags (idempotent; also run via `forum db:seed`)
bun run seed
```

> On a fresh Supabase DB, `migration:run` creates the `migrations` bookkeeping table, then applies every migration in timestamp order. Never edit or delete a migration that has already run on a shared DB — add a new one instead.

### Onboarding migration (`1783100000000-RefactorOnboarding`)

This migration:

- Adds `tags.key` (unique) and reseeds eight goal tags with stable keys
- Replaces `users.onboard_process` enum with `users.onboarded_at` timestamptz
- Truncates existing tag / user_tag data (goal names no longer map 1:1)

After migrating, run `forum db:seed` (or `bun run seed`) on fresh environments.

## Routes

| Method | Path              | Auth | Description                                      |
| ------ | ----------------- | ---- | ------------------------------------------------ |
| GET    | /                 | No   | Hello World                                      |
| GET    | /health           | No   | Health check                                     |
| GET    | /auth/me          | Yes  | Current user + profile (`onboarded`, goals, etc.) |
| POST   | /user/onboarding  | Yes  | Complete onboarding (single atomic submit)       |
| PATCH  | /user/profile     | Yes  | Update an already-onboarded profile (partial)    |

Removed (replaced by the routes above):

- `POST /user/role`
- `POST /user/goals`
- `POST /user/info`

### `GET /auth/me` profile shape

```jsonc
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "onboarded": true,
    "role": "Founder",
    "name": "Ada Lovelace",
    "occupation": "Founder",
    "age": 30,
    "location": "London",
    "goals": ["raise_capital", "find_cofounders"]
  }
}
```

### `POST /user/onboarding` request body

All fields are required. Goals must be stable tag keys from the seed/migration.

```jsonc
{
  "role": "Founder",           // or "Investor"
  "goals": ["raise_capital"],  // at least 1; see seed for valid keys
  "firstName": "Ada",
  "lastName": "Lovelace",
  "age": 30,
  "location": "London",
  "occupation": "Founder"
}
```

### Goal tag keys

| Key               | Display name        |
| ----------------- | ------------------- |
| `raise_capital`   | Raise capital       |
| `find_cofounders` | Find co-founders    |
| `gather_feedback` | Gather feedback     |
| `build_following` | Build a following   |
| `discover_startups` | Discover startups |
| `build_deal_flow` | Build deal flow     |
| `network_peers`   | Network with peers  |
| `market_insights` | Market insights     |

### `PATCH /user/profile` request body

Every field is optional; only provided fields are updated. Requires an existing onboarded user.

```jsonc
{
  "role": "Investor",
  "goals": ["discover_startups"],
  "firstName": "Ada",
  "lastName": "Lovelace",
  "age": 31,
  "location": "Paris",
  "occupation": "Angel"
}
```

## Run

```bash
bun run dev          # development (watch)
bun run start:prod   # production
```

Or via forum-server: `forum dev` / `forum up` (proxied at `http://api.forum.test`).

## Tests

```bash
bun run test         # unit (Jest via Node — required in Docker)
bun run test:e2e     # e2e
```

Key unit tests:

- `auth-profile.mapper.spec.ts` — `/auth/me` profile mapping
- `users-onboarding.service.spec.ts` — atomic onboarding + profile updates
- `supabase-auth.guard.spec.ts` — bearer token guard

## Lint

```bash
bun run lint       # check
bun run lint:fix   # check and auto-fix
```
