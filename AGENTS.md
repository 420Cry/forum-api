# AGENTS.md

Fundedr API — NestJS backend for forum-app. Verifies Supabase JWTs, stores user profiles and onboarding state in Postgres (via Supabase).

Read [../ARCHITECTURE.md](../ARCHITECTURE.md) for the cross-repo system map.

## Run

- Package manager: **Bun 1.2+** (`packageManager` in `package.json`)
- Install: `bun install`
- Env: copy `.env.example` → `.env`
- Dev (recommended): `forum dev` from [forum-server](../forum-server) → http://api.forum.test
- API only: `bun run dev`

## Verify (run before claiming "done")

```bash
bun run lint    # must exit 0
bun run test    # jest; must exit 0
```

From the monorepo dev-server: `forum lint:fix` runs eslint --fix in both forum-api and forum-app.

**Definition of done:** lint green, unit tests green. For route/guard changes, add or update specs in the matching `*.spec.ts` file.

## Hard constraints

- **Never commit** `.env`, service-role keys, or DB passwords.
- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to clients — server-only.
- **`synchronize` is off** — all schema changes go through TypeORM migrations in `src/database/migrations/`.
- **Don't reformat** files unrelated to your change.

## Domain vocabulary

- **Supabase UID** — primary key on `users` table (`supabaseUid`), FK to `auth.users(id)`.
- **Onboarded** — `users.onboarded_at IS NOT NULL`.
- **Onboarding step** — `users.onboarding_step` (1–3) while in progress; cleared on completion.
- **Goal tags** — stable `tags.key` values (e.g. `raise_capital`); seeded via `bun run seed`.
- **Mock data** — use fictional names in docs and tests (e.g. Alex Morgan, `founder@example.com`), not real personal data.

## Navigation

| If you are touching… | Read first |
|---|---|
| Auth guards | `src/modules/auth/` |
| `/auth/me` response shape | `src/modules/auth/auth-profile.mapper.ts` |
| Onboarding logic | `src/modules/users/onboarding/users-onboarding.service.ts` |
| Profiles / find / accounts | `src/modules/profiles/` |
| Follows | `src/modules/follows/` |
| Chat / Sendbird | `src/modules/chat/` |
| Route guards / decorators | `src/modules/users/guards/`, `src/modules/users/decorators/` |
| Migrations | `src/database/migrations/`, `src/database/dataSource.config.ts` |
| Goal tag seed | `src/database/seed.ts` |
| System overview | [../ARCHITECTURE.md](../ARCHITECTURE.md) |
| FE contract consumer | [../forum-app/AGENTS.md](../forum-app/AGENTS.md) |

## Route protection model

Two global guards (registered in `auth.module.ts`):

1. **`SupabaseAuthGuard`** — validates `Authorization: Bearer <token>` via `supabase.auth.getUser()`. Opt out with `@Public()`.
2. **`EmailVerifiedGuard`** — rejects tokens where `email_confirmed_at` is missing (403). Opt out with `@SkipEmailVerification()` on specific handlers.

Per-controller guard:

- **`OnboardingStateGuard`** on `UsersController` — reads `@RequiresOnboarded()` / `@RequiresNotOnboarded()` metadata.

### Route matrix

| Route | Public | Email verified | Onboarding state |
|-------|--------|----------------|------------------|
| `GET /`, `GET /health` | yes | — | — |
| `GET /auth/me` | no | skipped | — |
| `POST /user/onboarding` | no | yes | not onboarded |
| `PATCH /user/onboarding/draft` | no | yes | not onboarded |
| `PATCH /user/profile` | no | yes | onboarded |
| `GET /me/accounts` | no | yes | onboarded |
| `POST/PATCH /profiles/startup`, `POST/PATCH /profiles/investor` | no | yes | onboarded |
| `GET /profiles/startup/:id`, `GET /profiles/investor/:id`, `GET /profiles/user/:id` | yes | — | — |
| `GET /find` | no | yes | onboarded |
| `POST/DELETE /follows`, `GET /follows/me`, `GET /follows/connections`, `GET /follows/status` | no | yes | onboarded |
| `GET /chat/session`, `POST /chat/channels`, `GET /chat/unread` | no | yes | onboarded |

Service layer (`UserOnboardingService`) enforces the same onboarding rules as a second line of defence.

## Auth locally

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required everywhere, including local.
Unset Supabase env → protected routes return `401 Auth not configured`.
In tests that assert guard behaviour, mock `SupabaseService` instead of disabling auth.

## Database

Two migration tracks (do not mix them up) — both run from GitHub Actions (see [`.github/workflows/database.yml`](.github/workflows/database.yml)). Heroku only starts the web process (`Procfile`); it does **not** migrate.

| Event | What runs |
|---|---|
| **pull_request** (path-filtered) | TypeORM `migration:show` (auth/connect check) + `supabase db push --dry-run` — **no schema apply** |
| **push to `main`** / **workflow_dispatch** | TypeORM `migration:run` + `seed` + `supabase db push` |

| Track | Path | Applied by |
|---|---|---|
| TypeORM (app tables) | `src/database/migrations/` | Job **TypeORM migrate + seed** (main only) |
| Supabase CLI (Storage buckets, Storage RLS) | `supabase/migrations/` | Job **Supabase CLI migrations** (main only) |

```bash
bun run migration:run     # TypeORM — apply migrations
bun run migration:revert    # TypeORM — revert last
bun run seed                # goal tags (required for onboarding)
```

With forum-server: `forum db:migrate`, `forum db:seed`.

**Repo secrets** for [`.github/workflows/database.yml`](.github/workflows/database.yml):

| Secret | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | Project ref from the dashboard URL |
| `SUPABASE_DB_PASSWORD` (or `DB_PASSWORD`) | Database password — keep in sync with Heroku `DB_PASSWORD` |

No `DB_HOST` secret: the workflow runs `supabase link` and reads the IPv4 Session pooler host/port from `supabase/.temp/pooler-url`. `DB_USERNAME` is set at job level to `postgres.<SUPABASE_PROJECT_ID>` (bare `postgres` causes `28P01` on the pooler).

Heroku runtime still needs `DB_*` plus TLS: set `PGSSLMODE=no-verify` (not `require` — node-pg then verifies the CA and the dyno crashes). After deploy, `resolveDbSsl` also enables TLS for `*.supabase.co` / pooler hosts. Heroku `DB_USERNAME` must also be `postgres.<project-ref>`.

Manual run: **Actions → Deploy database → Run workflow**.

## Module layout

```
src/modules/
├── auth/           # guards, Supabase service, GET /auth/me
├── chat/           # Sendbird session, 1:1 channels, unread
├── follows/        # follow / unfollow / list / status
├── health/         # GET /health (@Public)
├── profiles/       # accounts, startup/investor CRUD, find, public GETs
├── root/           # GET / (@Public)
├── tags/           # internal — no HTTP controller
└── users/          # onboarding + profile endpoints
    ├── dto/
    ├── decorators/ # @RequiresOnboarded, @RequiresNotOnboarded
    ├── guards/     # OnboardingStateGuard
    └── onboarding/ # UserOnboardingService
```

## API response shapes

Profile mapping for `/auth/me` lives in `auth-profile.mapper.ts`. FE mirror: `forum-app/app/types/user.ts`. Keep both in sync when adding fields.

## Current state / known rough edges

- No OpenAPI / Swagger — contract is README + hand-written FE types.
- `toAuthProfile` lives under `auth/` but maps user domain data (candidate move to `users/`).
- `EnvService.getAuthConfig()` exists but `SupabaseService` reads `process.env` directly.
- E2E tests only cover `/` and `/health` — no auth/onboarding integration tests yet.
- `saveOnboarding` / `saveDraft` are not wrapped in an explicit DB transaction.

## How to make changes

1. Read scoped files from the navigation table.
2. New protected routes: rely on global guards; add `@Public()` only when truly anonymous.
3. Mutations that depend on onboarding state: add `@RequiresOnboarded()` or `@RequiresNotOnboarded()`.
4. Schema changes: create a migration (`bun run migration:create` or `migration:generate`).
5. Run `bun run lint && bun run test`.
6. Update `README.md` route table if endpoints change; update FE types if response shapes change.
