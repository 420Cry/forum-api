# Forum API
NestJS backend for forum-app.

## Project structure

```
src/
├── app/              # App module (imports feature modules)
├── database/         # TypeORM config, entities
├── modules/          # Feature modules (modular structure)
│   ├── auth/         # Firebase Admin, guards, token verification
│   ├── health/
│   ├── root/
│   └── users/
└── main.ts
```

**Flow:**
- **Modular structure** – Each feature lives in its own module (controller, service, tests).
- **DI with tokens** – Services use injection tokens (`ROOT_SERVICE`, `HEALTH_SERVICE`) via `@Inject()` for loose coupling and easier testing.
- **Auth** – Firebase Admin verifies ID tokens. `@Public()` marks routes as unauthenticated. Protected routes require `Authorization: Bearer <token>`.
- **Database** – TypeORM + MySQL. Entities in `database/entities/`. Syncs users from Firebase on first `/auth/me` call.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set:

## Routes

| Method | Path    | Auth | Description |
|--------|---------|------|-------------|
| GET    | /       | No   | Hello World |
| GET    | /health | No   | Health check |
| GET    | /auth/me | Yes  | Current user (Bearer token) |

## Run

```bash
npm run start:dev    # development
npm run start:prod   # production
```

## Tests

```bash
npm run test         # unit
npm run test:e2e     # e2e
```

## Adding a new route

1. Create a module under `src/modules/<name>/`:
   - `*.module.ts` – register controller, providers
   - `*.controller.ts` – use `@Public()` if no auth
   - `*.service.ts` – business logic
   - `*.service.interface.ts` – token + abstract class for DI
   - `index.ts` – barrel exports

2. Use DI: in the controller, `@Inject(TOKEN) private readonly service: ServiceToken`.
3. Register in `app.module.ts`: `imports: [..., NewModule]`.

## Adding tests

- **Controller tests** – Mock the service with `useValue`:

```ts
providers: [
  { provide: SOME_SERVICE, useValue: mockService },
]
```

- **E2E** – Import `AppModule` in `test/app.e2e-spec.ts` or add a dedicated e2e spec.

## Lint

```bash
npm run lint
```