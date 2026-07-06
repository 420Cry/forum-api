# Refactor onboarding API and add unit tests

## Summary

Replaces the per-step onboarding state machine with a single atomic submit and a boolean completion flag. Goal tags now use stable keys for reliable matching between client and API. Adds focused unit tests for auth profile mapping, onboarding persistence, and the Supabase auth guard.

## Motivation

The previous design had several problems:

- Three separate endpoints (`/user/role`, `/user/goals`, `/user/info`) advanced a server-side `onboard_process` enum, causing fragile ordering errors and unnecessary round-trips on every Back/Continue click.
- Goal matching relied on display names, which broke across locales and copy changes.
- `/auth/me` did not expose a clear onboarded flag for the frontend to route on.

## Changes

### Database (`1783100000000-RefactorOnboarding`)

- Adds `tags.key` (unique, not null) and reseeds eight goal tags with stable keys.
- Replaces `users.onboard_process` enum with `users.onboarded_at` timestamptz (`onboarded_at IS NOT NULL` = complete).
- Truncates `user_tag` / `tags` during migration (old tag names do not map 1:1 to new keys).

### API

| Before | After |
| ------ | ----- |
| `POST /user/role` | Removed |
| `POST /user/goals` | Removed |
| `POST /user/info` | Removed |
| — | `POST /user/onboarding` — single atomic submit |
| — | `PATCH /user/profile` — partial updates for onboarded users |

- `GET /auth/me` profile now includes `onboarded: boolean` and `goals: string[]` (tag keys).
- `UserOnboardingService.saveOnboarding()` persists role, profile fields, goal tags, and sets `onboarded_at` in one transaction.
- `TagsService.findByKeys()` resolves goals by stable key; unknown keys return `400`.

### Tests

- `auth-profile.mapper.spec.ts`
- `users-onboarding.service.spec.ts`
- `supabase-auth.guard.spec.ts`
- Jest test script runs via Node (`node ./node_modules/.bin/jest`) for Docker compatibility.

### Docs

- `README.md` updated with new routes, request bodies, goal keys, and migration notes.

## Migration / deploy notes

1. Run migrations: `forum db:migrate` or `bun run migration:run`
2. Seed goal tags on fresh DBs: `forum db:seed` or `bun run seed`
3. **Breaking:** clients must stop calling `/user/role`, `/user/goals`, `/user/info` and use `POST /user/onboarding` instead.
4. Existing users with `onboard_process = 'Completed'` are migrated to `onboarded_at = now()`.
5. Existing goal selections are cleared by the migration truncate — users who had partially completed onboarding will need to re-onboard.

## Test plan

- [ ] `bun run migration:run` on a fresh local DB succeeds
- [ ] `forum db:seed` inserts eight goal tags with expected keys
- [ ] `bun run test` — all unit tests pass
- [ ] `POST /user/onboarding` with valid body creates user, sets `onboarded_at`, links goal tags
- [ ] `POST /user/onboarding` with unknown goal key returns `400`
- [ ] `GET /auth/me` returns `profile.onboarded: true` and `goals: ["raise_capital", ...]` after onboarding
- [ ] `PATCH /user/profile` updates only provided fields for onboarded users
- [ ] Removed endpoints return `404`

## Related

- Frontend PR: forum-app — consumes `POST /user/onboarding` and `profile.onboarded`
- forum-server: `forum db:seed`, `forum db:delete-user <email>`
