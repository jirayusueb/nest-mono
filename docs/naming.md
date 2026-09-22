# Naming

One place for every naming rule in this monorepo. This file maps the
architecture guide onto our actual stack (Nest, zod, drizzle, TanStack Start).

## Casing

| Kind                                | Rule                                         | Example                                   |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Filenames                           | kebab-case; see [Filenames](#filenames)      | `session-issuer.ts`, `auth.module.ts`     |
| Classes / interfaces / types        | PascalCase                                   | `SessionIssuer`, `AuthIdentity`           |
| Functions / variables               | camelCase, verb-first                        | `toPostOutput`, `roleForEmail`            |
| React components                    | PascalCase named export = filename stem      | `admin-posts-page.tsx` → `AdminPostsPage` |
| Hooks                               | `use` + noun                                 | `useSession`                              |
| DI value tokens                   | SCREAMING_SNAKE                              | `DATABASE`, `CONFIG`                      |
| Env-derived consts / query-key maps | UPPER_SNAKE                                  | `API_ORIGIN`, `POST_QUERIES`              |
| Zod schema consts                   | camelCase + `Schema`                         | `signInSchema`                            |
| Drizzle tables                      | camelCase singular const; snake_case columns | `const post`, `created_at`                |

Framework-generated files are exempt: `route.tsx`, `root.tsx`, `routeTree.gen.ts`,
drizzle migrations/snapshots, test files adjacent to their subject (`*.test.ts`).

## Filenames

Name the file after its primary export (kebab-case). Two suffix styles, by origin:

- **Nest artifacts use dot-suffixes**: `*.module.ts`, `*.controller.ts`,
  `*.guard.ts`, `*.filter.ts`, `*.decorator.ts`, `*.pipe.ts` (`auth.module.ts`,
  `post.controller.ts`, `standard-schema-validation.pipe.ts`) — Nest CLI/idiom.
- **Everything else uses dash+role or bare stem**: infra class files carry the
  full class name (`rust-fs-bucket-store.ts`, `drizzle-post-repository.ts`,
  `webcrypto-session-token-service.ts`); domain/kernel object files carry role
  suffixes (`xxx-entity.ts`, `xxx-vo.ts`, `xxx-rules.ts` — `post-entity.ts`,
  `email-vo.ts`, `media-rules.ts`); presentation mappers are
  `<noun>-mappers.ts` (`post-mappers.ts`, `auth-mappers.ts`).

Multi-export non-class files are collections named by role:
`<feature>-dtos.ts` (application DTOs), `<feature>-response.ts` +
`mocks.ts`, `ids.ts`. Shared-scope collections are concept-named
(`shared/application/dtos/pagination.ts`).
Concept-named helper files are fine (`cookie.ts`, `session-user.ts`, `ids.ts`)
when the file has no single primary class.
`xxx-rules.ts` files export UPPER_SNAKE consts and verb-first pure functions
(`validatePassword`, `roleForEmail`); no classes.
Ports are abstract classes and double as their own DI tokens; value-token
constants (non-class values only) live beside the value they provision
(`DATABASE` in `db/database.ts`, `CONFIG` in `config/env.ts`), not in a
central tokens file.

## Classes by kind

Every class advertises its kind in its name: domain objects take
`Entity`/`VO`, technical classes take their role suffix.

| Kind                                 | Pattern                                            | Example                                                          |
| ------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------- |
| Entity                               | noun + `Entity`; `create`/`restore` factories      | `PostEntity`, `SessionEntity`                                    |
| Value object                         | noun + `VO`; `value` prop; `create`/`restore`      | `SlugVO`, `EmailVO`                                              |
| Domain service                       | bare noun                                          | `PasswordPolicy` (guide example; none in repo yet)               |
| Port (abstract class)                | `I` + noun + role; `I` reserved for ports only; members are `abstract`; the class is its own DI token | `IPostRepository`, `IBucketStore`, `IDateProvider`               |
| UseCase                              | verb + noun + `UseCase` suffix; `execute()` method | `CreatePostUseCase`, `GetSessionUseCase`                         |
| Repository impl                      | Tech + noun + `Repository`                         | `DrizzlePostRepository`, `MockPostRepository`                    |
| Infra service / store                | Tech + noun + role                                 | `RustFsBucketStore`, `DrizzleUnitOfWork`                         |
| Infra mapper                         | noun + `Mapper` (singular, static methods)         | `PostMapper`, `SessionMapper`                                    |
| Presentation mapper                  | dominant entity/feature + `Mappers` (plural)       | `AuthMappers`, `PostMappers`                                     |
| Controller / Module / Guard / Filter | concern + role                                     | `PostController`, `AuthModule`, `SessionGuard`, `AppErrorFilter` |
| Error                                | noun + `Error`                                     | `AppError`, `DomainError`                                        |
| Test fixture                         | `stored` + noun (+ `*Overrides` interface)         | `storedPost`, `StoredPostOverrides`                              |

Ports live in `application/ports/` (feature-scoped) or
`shared/application/interfaces/` (shared) — same concept, two scopes, matching
the guide's structure.

## Types by layer

| Layer                                 | Shape | Pattern              | Examples                                |
| ------------------------------------- | ----- | -------------------- | --------------------------------------- |
| Application (usecase boundary)        | in    | `XxxInput`           | `CreatePostInput`, `SignUpInput`        |
| Application (usecase boundary)        | out   | `XxxOutput`          | `PostOutput`, `IssuedSessionOutput`     |
| Transport (`presentation/http/dtos/`) | in    | `XxxRequest`         | `SignUpRequest`, `CreatePostRequest`    |
| Transport (`presentation/http/dtos/`) | out   | `XxxResponse`        | `GetSessionResponse`, `PostResponse`    |
| Domain factory shapes                 | —     | noun-form, no suffix | `PostCreation`, `PostUpdate`            |
| Port data contracts                   | —     | bare noun            | `AuthIdentity`, `BucketObjectHead`      |
| Storage record (entity-substitute)    | —     | noun + `Record`      | `MediaRecord`                           |
| DB row type (infrastructure)          | —     | noun + `Row`         | `UserRow`, `PostRow`, `IdentityJoinRow` |
| Kernel vocabulary                     | —     | bare noun            | `SessionUser`, `Result`, `AppError`     |

Mappers are `to` + the target type, dropping layer words where clear
(`toPostOutput`, `toUserResponse`, `toCreatePostInput`).

## Tests

`describe`/`it` subjects are lowercase, space-separated, mirroring the subject's
filename stem (`describe("sign up")`, `describe("app error filter")`); use
`it()`, not `test()`; phrase the title as behavior, not a method name.

## Web (apps/web)

Components are PascalCase named exports matching kebab filename stems; hooks
`useXxx`; data-layer objects camelCase (`postApi`); query-key maps UPPER_SNAKE
(`POST_QUERIES`); shared API types bare nouns (`Post`, `User`).

## Intentional deviations from the guide

- **Drizzle schemas stay centralized in `src/shared/infrastructure/db/schema/*`.** The guide puts
  them in `features/*/infrastructure/schema/`, but tables reference each other
  across features (`post.author_id → user.id`, `media.user_id → user.id`), so
  feature-owned schema files would require feature→feature imports, which
  `no-illegal-layer-imports` forbids. `db/` is a root: feature
  `infrastructure/` may import it; `application/` and `presentation/` may not
  (runtime), and the lint rule enforces exactly that.
  The persistence runtime lives in the same root: `db/database.ts` (client +
  `DATABASE` token), `db/drizzle-unit-of-work.ts`, `db/tx-storage.ts`, and
  `db/migrate.ts` — no separate `database/` directory.
- **The per-feature composition root is the Nest `<feature>.module.ts`** at
  the feature root, which is the guide's `ioc.ts`. `bootstrap/` holds only
  `AppModule` and `create-app.ts`; feature-global modules (e.g. the
  `@Global()` `AuthModule`) live in their feature. The feature root holds only
  `*.module.ts` composition roots; cross-feature port adapters (e.g.
  `identity-repository.adapter.ts`) live in the owning feature's
  `infrastructure/adapters/`. The lint rule classifies only `*.module.ts`
  feature-root files as composition roots and polices any other feature-root
  file as infrastructure: cross-feature imports are allowed only into the
  other feature's `application/ports/**`, its `*.module.ts`, or its domain as
  type-only imports.
