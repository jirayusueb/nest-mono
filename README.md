# nest-mono

Bun monorepo: a NestJS + Fastify API following Feature-First Clean Architecture, a TanStack Start web app, and Alchemy-managed local infrastructure (Postgres 18, RustFS S3-compatible storage) — all in Docker.

## Structure

```
apps/
  server/        # thin Bun entrypoint: env → migrations → bucket → listen
  web/           # TanStack Start + React 19 + MUI (file-based routes, FSD-ish)
packages/
  api/           # NestJS 12 + Fastify, feature-first clean architecture
  ui/            # shared MUI + Tiptap components
  infra/         # Alchemy IaC: postgres + rustfs containers (+ server image)
  config/        # shared tooling config
```

`packages/api` is where the app lives. Each feature (`auth`, `blog`, `media`, `user`) is layered:

```
features/<name>/
  domain/          # entities, value objects, rules
  application/     # usecases, ports (I-prefixed interfaces), DTOs
  infrastructure/  # Drizzle repositories, mappers, stores
  presentation/    # HTTP controllers, request/response DTOs
  <name>.module.ts # feature composition root
shared/            # kernel (Result, AppError, ids), cross-feature ports + infra
db/                # centralized Drizzle schema + migrations
```

Dependencies point inward only; an oxlint rule (`anti-slop/no-illegal-layer-imports`) enforces it. Architecture authority: [`clean-architecture-guide.md`](./clean-architecture-guide.md). Naming: [`naming.md`](./docs/naming.md).

## Stack

| Concern | Choice                                               |
| ------- | ---------------------------------------------------- |
| Runtime | Bun 1.4                                              |
| API     | NestJS 12 on Fastify, zod 4 validation               |
| DB      | Postgres 18 + Drizzle ORM                            |
| Storage | RustFS (S3 API) via aws4fetch presign                |
| Web     | TanStack Start/Router/Query, MUI + Emotion, React 19 |
| Editor  | Tiptap 3 (markdown)                                  |
| Infra   | Alchemy (Docker provider)                            |
| Tooling | vite-plus (`vp`), oxlint, vitest, commitlint         |

## Getting started

```sh
bun install
cp .env.example .env      # defaults target the local docker infra
bun run db:up             # start postgres + rustfs containers
bun run dev               # api :3000, web :5173
```

First run: the server runs migrations and ensures the S3 bucket automatically (`apps/server/src/main.ts`).

## Commands

| Command               | What it does                                                 |
| --------------------- | ------------------------------------------------------------ |
| `bun run dev`         | dev servers for every workspace                              |
| `bun run test`        | vitest (`packages/api`)                                      |
| `bun run check-types` | `tsc --noEmit` across workspaces                             |
| `bun run lint`        | oxlint                                                       |
| `bun run fmt`         | format (write)                                               |
| `bun run db:generate` | generate Drizzle migrations                                  |
| `bun run db:up`       | `alchemy deploy` — local postgres + rustfs                   |
| `bun run deploy`      | same + build & run the server container (`DEPLOY_APPS=true`) |
| `bun run destroy`     | tear down the stack (named volumes are retained)             |

## Environment

See [.env.example](./.env.example): `DATABASE_URL`, `PORT`, `WEB_ORIGIN`, S3 settings (`S3_ENDPOINT`/`REGION`/`BUCKET`/`KEYS`), `ADMIN_EMAILS`.
