# Naming

Single source of truth for names across the monorepo. Architecture authority is
`clean-architecture-guide.md`; this file translates it to this repo's stack
(Nest, zod, drizzle, TanStack Start).

## Casing

| Kind                                | Rule                                         | Example                                   |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Filenames                           | kebab-case; see [Filenames](#filenames)      | `session-issuer.ts`, `auth.module.ts`     |
| Classes / interfaces / types        | PascalCase                                   | `SessionIssuer`, `AuthIdentity`           |
| Functions / variables               | camelCase, verb-first                        | `toPostOutput`, `roleForEmail`            |
| React components                    | PascalCase named export = filename stem      | `admin-posts-page.tsx` → `AdminPostsPage` |
| Hooks                               | `use` + noun                                 | `useSession`                              |
| DI tokens                           | SCREAMING_SNAKE                              | `POST_REPOSITORY`, `DATE_PROVIDER`        |
| Env-derived consts / query-key maps | UPPER_SNAKE                                  | `API_ORIGIN`, `POST_QUERIES`              |
| Zod schema consts                   | camelCase + `Schema`                         | `signInSchema`                            |
| Drizzle tables                      | camelCase singular const; snake_case columns | `const post`, `created_at`                |

Framework-generated files are exempt: `route.tsx`, `root.tsx`, `routeTree.gen.ts`,
drizzle migrations/snapshots, test files adjacent to their subject (`*.test.ts`).

## Filenames

Stem = kebab of the file's primary export. Two suffix styles, by origin:

- **Nest artifacts use dot-suffixes**: `*.module.ts`, `*.controller.ts`,
  `*.guard.ts`, `*.filter.ts`, `*.decorator.ts`, `*.pipe.ts` (`auth.module.ts`,
  `blog.controller.ts`, `standard-schema-validation.pipe.ts`) — Nest CLI/idiom.
- **Everything else uses dash+role or bare stem**: infra class files carry the
  full class name (`rust-fs-bucket-store.ts`, `drizzle-blog-repository.ts`,
  `webcrypto-session-token-service.ts`); domain/kernel object files carry role
  suffixes (`xxx-entity.ts`, `xxx-vo.ts`, `xxx-rules.ts` — `post-entity.ts`,
  `email-vo.ts`, `media-rules.ts`); presentation mappers are
  `<feature>-mappers.ts`.

Multi-export non-class files are collections named by role:
`<feature>-dtos.ts` (application DTOs), `<feature>-response.ts` +
`mocks.ts`, `ids.ts`. Shared-scope collections are concept-named
(`shared/application/dtos/pagination.ts`).
Concept-named helper files are fine (`media-rules.ts`, `cookie.ts`, `role.ts`,
`presign.ts`) when the file has no single primary class.
DI token constants live beside the interface they inject
(`DATE_PROVIDER` in `i-date-provider.ts`), not in a central tokens file.

## Classes by kind

Every class carries its kind: domain objects take `Entity`/`VO`, technical
classes take their role suffix.

| Kind                                 | Pattern                                            | Example                                                          |
| ------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------- |
| Entity                               | noun + `Entity`; `create`/`restore` factories      | `PostEntity`, `SessionEntity`                                    |
| Value object                         | noun + `VO`; `value` prop; `create`/`restore`      | `SlugVO`, `EmailVO`                                              |
| Domain service                       | bare noun                                          | `PasswordPolicy` (guide example; none in repo yet)               |
| Port (interface)                     | `I` + noun + role; `I` reserved for ports only     | `IPostRepository`, `IBucketStore`, `IDateProvider`               |
| UseCase                              | verb + noun + `UseCase` suffix; `execute()` method | `CreatePostUseCase`, `GetSessionUseCase`                         |
| Repository impl                      | Tech + noun + `Repository`                         | `DrizzleBlogRepository`, `MockPostRepository`                    |
| Infra service / store                | Tech + noun + role                                 | `RustFsBucketStore`, `DrizzleUnitOfWork`                         |
| Infra mapper                         | noun + `Mapper` (singular, static methods)         | `BlogMapper`, `SessionMapper`                                    |
| Presentation mapper                  | feature + `Mappers` (plural, static methods)       | `AuthMappers`, `BlogMappers`                                     |
| Controller / Module / Guard / Filter | concern + role                                     | `BlogController`, `AuthModule`, `SessionGuard`, `AppErrorFilter` |
| Error                                | noun + `Error`                                     | `AppError`, `DomainError`                                        |
| Test fixture                         | `stored` + noun (+ `*Overrides` interface)         | `storedPost`, `StoredPostOverrides`                              |

Ports live in `application/ports/` (feature-scoped) and
`shared/application/interfaces/` (shared) — same concept, two scopes, per the
guide's structure.

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

Mapper functions: `to` + target type name without layer words where clear
(`toPostOutput`, `toUserResponse`, `toCreatePostInput`).

## Web (apps/web)

Components are PascalCase named exports matching kebab filename stems; hooks
`useXxx`; data-layer objects camelCase (`postApi`); query-key maps UPPER_SNAKE
(`POST_QUERIES`); shared API types bare nouns (`Post`, `User`).

## Intentional deviations from the guide

- **Drizzle schemas stay centralized in `src/db/schema/*`.** The guide puts
  them in `features/*/infrastructure/schema/`, but tables reference each other
  across features (`post.author_id → user.id`, `media.user_id → user.id`), so
  feature-owned schema files would require feature→feature imports, which
  `anti-slop/no-illegal-layer-imports` forbids. `db/` is a root: feature
  `infrastructure/` may import it; `application/` and `presentation/` may not
  (runtime), and the lint rule enforces exactly that.
- **The per-feature composition root is the Nest `<feature>.module.ts`** at
  the feature root, which is the guide's `ioc.ts`. `bootstrap/` holds only
  `AppModule` and `create-app.ts`; feature-global providers (e.g.
  `SessionModule`) live in their feature. Cross-feature port adapters (e.g.
  `identity-repository.adapter.ts`) sit at the feature root beside the module
  — composition-root artifacts, layer-unclassified by design.
