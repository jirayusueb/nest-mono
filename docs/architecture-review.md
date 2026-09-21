# Clean Architecture Review — nest-mono

**Date:** 2026-09-21 · **Scope:** `packages/api` (primary), `apps/server` + `apps/web` at their boundaries · **Mode:** report only, no code changed.

## 1. Preamble

The codebase was audited against the Clean Architecture principles in the four
supplied books. Martin's *Clean Architecture: A Craftsman's Guide to Software
Structure and Design* (Pearson, 2018) carries primary citation weight; the
derivative books are cited where they state the same principle.

| Book | Status |
| --- | --- |
| Robert C. Martin, *Clean Architecture* (470 pp) | Full text extracted; primary rubric |
| Vinu V Das, *The Clean Architecture Handbook* (2025, 227 pp) | Full text extracted; cited for enforcement + testing chapters |
| Elijan Lewis, *Clean Architecture: Advanced and Effective Strategies* (123 pp) | Text extracted; derivative; cited for SOLID/dependency-rule chapters |
| Anderson Rogério, *Clean Architecture* (157 pp) | **Excluded.** Scanned image PDF with no text layer, pages rotated 180°, watermarked "Machine Translated by Google"; OCR output unusable for citation-grade extraction. Exclusion per pre-agreed contingency. |

**Method:** all ~100 source files under `packages/api/src` were read or
grep-swept; every claim below cites a file:line that was opened, or a grep that
was run exhaustively over `packages/api/src`. Book citations were located in
the extracted book text, not memory.

**Baseline runs** (from repo root, 2026-09-21):

| Command | Result |
| --- | --- |
| `bun run lint` | **FAIL** — exit 1, 19 errors across 11 files, all `anti-slop/*` (5 × `organize-imports`, 4 × `no-runtime-typeof`, 4 × `require-safety-comment-for-type-assertion`, 3 × `no-unknown-parameters`, 3 × `no-known-value-widening`). **Zero** layer-import violations. |
| `bun run check-types` | **PASS** — tsc `--noEmit` clean in all 5 workspaces (`packages/{api,ui,infra}`, `apps/{server,web}`) |
| `bun run test` | **PASS** — 15 files, 57 tests, 331 ms (`vp test run --dir packages/api`) |

## 2. Rubric

| # | Dimension | Book basis (extracted text) |
| --- | --- | --- |
| A | Dependency Rule | Martin ch. 22 "The Clean Architecture" — "Source code dependencies must point only inward, toward higher-level policies. … Nothing in an inner circle can know anything at all about something in an outer circle." Vinu §2.3 "The Dependency Rule" incl. "Practical Enforcement Techniques" ("Automated Checks … detect 'illegal' dependencies"). Elijan ch. 8 "The Dependency Rule". |
| B | Domain purity / framework independence | Martin ch. 22 — business rules "Independent of Frameworks … Independent of any external agency"; ch. 20 "Business Rules" (entities encapsulate critical rules). Vinu §1.4 "Goals", §4.2 "Entities vs. Business Rules". Elijan ch. 8. |
| C | Use cases / interactors | Martin ch. 21–22 (use cases as architectural elements); Vinu §4.1 "The Role of Use Cases in Design". |
| D | Boundaries: DTOs, mappers, ports & adapters | Martin ch. 22 "Crossing Boundaries"; ch. 23 "Presenters and Humble Objects" (Database Gateways, Data Mappers); ch. 11 DIP. Vinu §4.3 "Data Access and Persistence Boundaries". Elijan ch. 12 "When We Cross Boundaries". |
| E | SOLID at module level | Martin ch. 7–11 (SRP, OCP, LSP, ISP, DIP). Vinu ch. 3. Elijan ch. 7. |
| F | Component cohesion/coupling | Martin ch. 13 "Component Cohesion", ch. 14 "Component Coupling". Vinu §2.4 "Cohesion and Coupling in Software Design". Elijan ch. 10. |
| G | Screaming Architecture | Martin ch. 21 "Screaming Architecture". |
| H | Testability & test strategy | Martin ch. 28 "The Test Boundary" ("The tests are part of the system, and they participate in the architecture"); ch. 23 (Humble Object: split hard-to-test from testable behavior). Vinu ch. 9 "Testing Strategies in Clean Architecture". |
| I | Main component | Martin ch. 26 "The Main Component" ("the ultimate detail — the lowest-level policy"). |
| J | Databases/frameworks as details | Martin ch. 30 "The Database Is a Detail"; ch. 22 ("all SQL should be restricted to this layer"); ch. 32 "Frameworks Are Details". |

## 3. Scorecard

| # | Dimension | Verdict | Evidence pointer |
| --- | --- | --- | --- |
| A | Dependency Rule | ✅ Compliant | Exhaustive greps: no inner→outer import anywhere (§5) |
| B | Domain purity | ✅ Compliant, two anemic spots | Zero framework imports in `domain/`+`kernel/`; findings 2, 3 |
| C | Use cases | ✅ Compliant | 15 single-purpose use case classes, ports + `Result` |
| D | Boundaries / DIP | ✅ Compliant | Ports owned by application; mappers at every crossing; findings 5, 6 |
| E | SOLID | ✅ Compliant | One-class-per-use-case; narrow ports; finding 4 (policy duplication) |
| F | Component coupling | ✅ Compliant | `shared/` imports zero features; single cross-feature edge (auth→user) |
| G | Screaming Architecture | ✅ Compliant | `features/{auth,blog,media,user}/application/usecases/{sign-up,create-post,…}` |
| H | Test strategy | ⚠️ Deviation | Strong mocked-usecase core; mappers/repos/controllers/filter paths untested; lint gate red |
| I | Main component | ✅ Compliant | `apps/server/src/main.ts` = 19 lines; `AppModule.forRoot(env)` |
| J | DB as detail | ✅ Compliant (documented tradeoff) | All SQL in `infrastructure/`; schema centralized per-feature-file |

## 4. Findings

Severity follows the repo's review language: **violation** (request-changes
class), **deviation** (accepted-for-now tradeoff that should be revisited),
**nit** (non-blocking). There are no violations: nothing in the codebase
breaches the Dependency Rule or the books' structural principles. The findings
below are deviations and nits.

### Deviations

**D1. Persistence and HTTP boundary code has zero tests — the pyramid is inverted at the edges.**
Evidence: the 15 test files cover domain entities (`session-entity.test.ts`,
`post-entity.test.ts`), use cases with mock ports (`create-post.test.ts` etc.),
two infra impls (`scrypt-password-hasher.test.ts`, `rust-fs-bucket-store.test.ts`)
and two shared units (`app-error.filter.test.ts`, `pagination.test.ts`).
Untested: all 4 Drizzle repositories, all 5 mappers (`post-mapper.ts`,
`session-mapper.ts`, `user-mapper.ts`, `media-mapper.ts`, presentation mappers),
`identity-repository.adapter.ts`, 5 controllers, both guards, the validation
pipe. `drizzle-post-repository.ts:55-299` alone holds ~250 lines of real logic
(slug resolution `:251-272`, tag dedup `:274-298`, soft delete `:229-240`,
keyset pagination `:55-90`) with no test.
Books: Martin ch. 28 — "The tests are part of the system, and they participate
in the architecture just like every other part of the system does"; ch. 23
"Database Gateways"/"Data Mappers" — the boundary is exactly where translation
bugs live. Vinu ch. 9 (testing strategies per layer).
Recommendation: mapper unit tests against fixture rows (cheap, no DB), one
supertest/e2e pass per guarded flow (sign-in → create post → delete), and
integration tests for `DrizzlePostRepository` and `IdentityRepositoryAdapter`
against a disposable Postgres. This is the highest-value remediation in the
report.

**D2. Media domain is anemic — lifecycle invariants are procedural.**
Evidence: `features/media/domain/` contains only `rules/media-rules.ts`
(constants + one type guard). There is no entity; state lives in
`MediaRecord` (`application/dtos/media-dtos.ts:3-12`, `confirmed: boolean`).
The confirm workflow enforces ownership, type, and size inside the use case
(`confirm-media.ts:24-49`), then flips the boolean via
`repo.confirm(input.key, …)` (`:47`). Nothing models or guards the state
machine: double-confirm, confirming after delete, or deleting a pending
upload are all unguarded transitions.
Books: Martin ch. 20 — entities are objects that "contain the most
general/critical business rules"; Vinu §4.2 "Entities vs. Business Rules".
A two-state lifecycle is small, which is why this is a deviation and not a
violation — but the invariants exist (confirm validates type/size) and live
in the wrong ring to be reused by a second caller.
Recommendation: extract a `MediaEntity` with `createPending/confirm/delete`
transitions returning `Result`; keep the use case as orchestration only.

**D3. `UserEntity` is restore-only — user creation bypasses the entity.**
Evidence: `features/user/domain/entities/user-entity.ts:15-33` has a single
factory, `restore`, and no behavior, no validation, no tests. Users are
actually created via the repository input
(`identity-repository.adapter.ts:44-51` → `drizzle-user-repository.ts:54-69`),
with name policy enforced by the *caller* (`sign-up.ts:45-51` via kernel
`validateName`) rather than by the entity. A second creation path (admin
import, seeding) would have to remember to re-implement the checks.
Books: Martin ch. 20 (critical rules belong inside the entity, not scattered
among callers); Vinu §4.2.
Recommendation: add `UserEntity.create(...)` encapsulating name/email policy
(and a small test), and route `IdentityRepositoryAdapter.createWithCredential`
through it.

### Nits

**N4. Password composition policy is expressed twice and can diverge.**
`domain/rules/password-rules.ts:5-7,20-26` gates uppercase/digit checks behind
`PASSWORD_REQUIRE_UPPERCASE/NUMBER` flags; the edge schema
`auth-schemas.ts:18-19` hardcodes `.regex(/[A-Z]/u…)` and `.regex(/\d/u…)`
unconditionally. Flip either flag and presentation rejects what the domain
accepts. Length bounds are shared constants (good) — the composition rules
should be derived, not restated. Books: Martin ch. 7 (SRP — one authority per
rule), ch. 22 (edge should defer to inner ring).

**N5. API contract types are hand-copied into the web client.**
`apps/web/src/shared/api/post.ts:6-15` duplicates `PostResponse`
(`blog-response.ts:1-11`) field-for-field (today aligned; `Date`→`string`
serialization aside). Nothing mechanical prevents drift; the repo guide's
end-to-end type-safety chapter is written for Elysia Eden and does not apply
to this Nest stack. Books: boundary discipline (Martin ch. 22 "Crossing
Boundaries") — fine at runtime, fragile at compile time.
Recommendation: export response DTOs from a shared contracts package, or
generate them from the zod schemas.

**N6. `IdentityRepositoryAdapter` is an infrastructure adapter classified as a composition root.**
The file at feature root (`identity-repository.adapter.ts`) writes SQL
(`:52-60`, `:72-78`) and imports `DATABASE`/schema/`tx-storage`. The lint rule
permits it only because every feature-root file is unrestricted
(`tools/oxlint/anti-slop/rules/no-illegal-layer-imports.ts:185-187`); by
content it belongs in `features/auth/infrastructure/repositories/` (the
cross-feature allowlist already permits importing user's ports from any layer,
`no-illegal-layer-imports.ts:168-175`). Placement, not substance.

**N7. The lint gate is red.**
19 errors across 11 files (see §1 baseline), including 5 `organize-imports`
and 4 missing `SAFETY:` comments in `create-app.ts:27-28`,
`auth.controller.ts:37`. The dependency-rule rule itself passes — but a
permanently failing gate trains `--force` habits and hides future real
violations. Books: Vinu §2.3 "Practical Enforcement Techniques" (automated
checks are the safety net); Martin ch. 2 "Fight for the Architecture".

**N8. `session.token` column stores a SHA-256 hash.**
`schema/auth.ts:43` names the column `token`; `session-mapper.ts:31` writes
`entity.tokenHash` into it. Naming misleads anyone reading the table; the real
token only ever exists in the cookie/`SessionIssuer`. Rename to `token_hash`
(+ migration) next time the schema moves.

## 5. Enforcement gap analysis

`no-illegal-layer-imports` implements the repo guide §3 and, point for point,
Martin's Dependency Rule for static imports:
domain → own-domain/kernel only (`:139-146`); kernel → kernel (`:148-151`);
shared → never features (`:153-161`); cross-feature allowlist = other
feature's application ports, its `<f>.module.ts`, or type-only domain imports
(`:163-183`); application → nothing outward (`:191-199`); infrastructure →
not presentation (`:201-205`); presentation → infra/db type-only
(`:207-213`), domain constants/types only (`:214-219`).

Actual code vs. those rules (exhaustive greps over `packages/api/src`):

| Gap in the rule | Exploited? | Notes |
| --- | --- | --- |
| Feature-root files unrestricted (`:187`) | **Yes — by design** | Modules + `IdentityRepositoryAdapter` (N6). Only load-bearing gap today. |
| `db/` files unrestricted (`:66`) | No | `db/*` imports only drizzle + each other (`migrate.ts:3`, `drizzle-unit-of-work.ts:5-6`). |
| Unclassified paths unrestricted (`:34`) | No | Only `src/index.ts`. |
| Presentation → infra type-only escape hatch | No | No occurrence found. |
| Presentation → domain runtime constants | Yes — intended | Schemas import domain bounds (`auth-schemas.ts:3-10`, `blog-schemas.ts`) — single source of truth for limits; direction is inward. |
| Infrastructure → other feature's domain at runtime | No | Zero occurrences. |
| DI-token wiring invisible to static analysis | Inherent | Mitigated structurally: tokens are bound only inside module files, which are unrestricted composition roots by design (Martin ch. 26). |

Cross-feature imports in the whole codebase: `auth.module.ts:6-7` (user port +
UserModule) and `identity-repository.adapter.ts:7-8` (user port, type-only
entity) — both on the allowlist. `shared/` imports zero feature files. The
Dependency Rule holds with no manual exceptions filed anywhere.

## 6. Strengths (with evidence)

- **Port-driven use cases returning `Result`.** All 15 use cases depend only
  on `I*` ports, `IDateProvider`/`IIdGenerator`/`IUnitOfWork`, and kernel
  types (`create-post.ts:20-26`, `sign-up.ts:21-28`, `update-post.ts:14-18`);
  errors are values (`kernel/types/result.ts` re-exporting `better-result`).
  This is Martin ch. 21–22 nearly verbatim, and it is why the use case tests
  need no DB or HTTP.
- **A clean domain layer.** Zero `@nestjs`/`drizzle`/`zod`/`fastify` imports
  under any `features/*/domain/` or `shared/kernel/` (exhaustive grep).
  `PostEntity` is a real entity — `create/validate/update/delete` with VOs
  and `Result` (`post-entity.ts:42-189`); `SessionEntity` validates its hash
  shape and expiry (`session-entity.ts:52-68`).
- **Humble controllers, guarded by ports.** Controllers translate
  `Result.isErr → throw` and map to response DTOs
  (`post.controller.ts`, `user.controller.ts:18-27`); `SessionGuard` depends
  on `ISessionResolver` injected by token (`session.guard.ts:25-35`) —
  Martin ch. 23's Humble Object pattern, realized.
- **Composition roots are the only place details meet.** `main.ts` = 19 lines
  of policy-free startup; `AppModule.forRoot(env)` (`app.module.ts:16-31`);
  each feature module binds ports to impls (`media.module.ts:28-61`,
  `auth.module.ts`). Swap Fastify/Drizzle/scrypt/RustFS without touching a
  use case.
- **The architecture is enforced, not aspirational.** A custom oxlint rule
  encodes the Dependency Rule — exactly Vinu §2.3's "Automated Checks"
  recommendation, which most codebases skip.
- **Screaming structure.** `features/auth/application/usecases/sign-in.ts`
  tells a new reader what the system *does* — Martin ch. 21.
- **Transactional integrity behind a port.** `IUnitOfWork.runInTransaction`
  (`i-unit-of-work.ts`) with ALS propagation (`drizzle-unit-of-work.ts:12-14`,
  `tx-storage.ts`) keeps transaction semantics out of use case signatures.

## 7. Prioritized remediation

1. **Tests at the boundaries** (D1) — mapper fixtures first (no infra needed),
   then e2e for the three guarded flows, then repo integration tests.
2. **`MediaEntity` with guarded transitions** (D2).
3. **`UserEntity.create` + test; route the adapter through it** (D3).
4. **Derive or drop the duplicated password regexes** (N4) — one-line-ish.
5. **Shared/generate web contract types** (N5).
6. **Move `identity-repository.adapter.ts` into `auth/infrastructure/` and
   tighten `FEATURE_ROOT_PATH_RE` to `*.module.ts`** (N6) — makes the only
   load-bearing enforcement gap disappear.
7. **Fix the 19 lint errors; keep the gate green** (N7).
8. **Rename `session.token` → `token_hash`** (N8) with the next migration.
