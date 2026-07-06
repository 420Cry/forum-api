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

Service layer (`UserOnboardingService`) enforces the same onboarding rules as a second line of defence.

## Dev auth bypass

When `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are unset and `NODE_ENV !== 'production'`, `SupabaseAuthGuard` allows requests without a token. `GET /auth/me` returns `{ id: null, profile: null }`. Do not rely on this in tests that assert guard behaviour — mock `SupabaseService` instead.

## Database

```bash
bun run migration:run     # apply migrations
bun run migration:revert    # revert last
bun run seed                # goal tags (required for onboarding)
```

With forum-server: `forum db:migrate`, `forum db:seed`.

## Module layout

```
src/modules/
├── auth/           # guards, Supabase service, GET /auth/me
├── health/         # GET /health (@Public)
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
