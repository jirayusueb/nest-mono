# @nest-mono/treaty — Eden-style typesafety for vanilla NestJS

Date: 2026-09-19
Status: approved design (brainstorming output)

## Problem

The web app re-declares every API shape by hand. `apps/web/src/shared/api/`
duplicates `PostResponse` as `Post`, `CreatePostBody` as `PostDraft`,
`UpdatePostBody` as `PostPatch`, `UserResponse` as `User`, and every call
re-states its generic (`apiFetch<{ posts: Post[] }>`). Server DTO changes drift
silently until runtime. We want the Elysia Eden property — frontend types flow
from the server source with zero codegen — against **pure vanilla NestJS
controllers**, which stay exactly as they are.

## Why not the existing options

- **ts-rest** (contract-first): moves shapes into a separate contract DSL;
  controllers stop being vanilla. Re-declares what we're trying to infer.
- **OpenAPI codegen** (`@nestjs/swagger` → `openapi-typescript` →
  `openapi-fetch`): build step, types from annotations rather than inference,
  emit/serve drift. The opposite of Eden's property.

## The constraint that shapes the design

TypeScript can infer **shapes** from vanilla controller signatures (param
types via `Parameters<M>`, response via `Awaited<ReturnType<M>>`), but cannot
see **decorator arguments**: `@Get(":slug")` paths, verbs, and param bindings
live only in runtime reflect-metadata. So paths/verbs/bindings are the single
fact that must be declared twice — and that copy is machine-checked against
Nest's own metadata by a test. Shapes are never duplicated.

A second constraint: the web cannot import controller modules (they drag
usecases/DB/Fastify into the browser bundle). So everything the web consumes
must be pure data plus type-only imports, exported through a subpath.

## Package surface — `packages/treaty` (`@nest-mono/treaty`)

Zero runtime dependencies.

- Authoring (server): `manifest()`, `route(verb, path, binding)`,
  types `Controllers`, `Treaty<M>`, `TreatyInjected`.
- Client (web): `treaty(origin, routes)`, `ApiError` (same shape as today's
  `client.ts`: `status`, `code`, `message`).
- Type helper: `TreatyResponse<M, controller, method>` for bare response
  annotations (queryOptions, props).

`binding` is an ordered arg-kind tuple `("param" | "query" | "body")[]`
describing the controller method's transport arguments (after injected ones
are stripped).

## Server artifact — `packages/api/src/bootstrap/app-routes.ts`

Pure data + `import type` controller imports only:

```ts
import type { AuthController } from "../features/auth/presentation/http/auth.controller";
import type { BlogController } from "../features/blog/presentation/http/blog.controller";
import type { MediaController } from "../features/media/presentation/http/media.controller";
import type { UserController } from "../features/user/presentation/http/user.controller";

export const appRoutes = manifest<Controllers>({
  blog: {
    list: route("GET", "/api/posts", []),
    categories: route("GET", "/api/posts/categories", []),
    getBySlug: route("GET", "/api/posts/:slug", ["param"]),
    create: route("POST", "/api/posts", ["body"]),
    update: route("PATCH", "/api/posts/:id", ["param", "body"]),
    remove: route("DELETE", "/api/posts/:id", ["param"]),
  },
  auth: {
    signUpEmail: route("POST", "/api/auth/sign-up/email", ["body"]),
    signInEmail: route("POST", "/api/auth/sign-in/email", ["body"]),
    signOutRoute: route("POST", "/api/auth/sign-out", []),
    getSessionRoute: route("GET", "/api/auth/get-session", []),
  },
  user: { me: route("GET", "/api/user/me", []) },
  media: {
    createTarget: route("POST", "/api/media/target", ["body"]),
    confirm: route("POST", "/api/media/confirm", ["body"]),
    list: route("GET", "/api/media", []),
    remove: route("DELETE", "/api/media/:key", ["param"]),
  },
});

export type AppTreaty = Treaty<typeof appRoutes>;
```

Re-exported via a **new subpath export** `"@nest-mono/api/treaty"` (root `.`
export pulls `createApp`/DB; subpath keeps the web bundle clean).

Scope note: `HealthController` (`/health`) is server-ops only; deliberately
not in the manifest.

## Type mechanics

```ts
type Controllers = {
  blog: typeof BlogController;
  auth: typeof AuthController;
  media: typeof MediaController;
  user: typeof UserController;
};

type ManifestShape<C extends Controllers> = {
  [K in keyof C]: { [M in MethodNames<InstanceType<C[K]>>]: RouteDecl };
};
```

- `manifest<C extends Controllers>(def: ManifestShape<C>)` — `C` is given
  explicitly (`manifest<Controllers>`) because controllers can only be
  type-only imports here; the literal is then checked so a missing or unknown
  method name is a compile error — the manifest is forced to cover every
  public method of every controller.
- `MethodNames` = declared public methods of the instance type (`keyof`
  already excludes `constructor` and `Object.prototype` members). Convention:
  controllers stay route-only; all 4 do today. A public helper method would be
  forced into the manifest and fail loudly — acceptable and visible.
- Client method type:
  `(...args: StripInjected<Parameters<M>>) => Promise<Awaited<ReturnType<M>>>`.
  Response is the controller's own return type; inputs are its own param
  types. Positional labels preserved where TS allows.
- `StripInjected` recursively filters tuple elements extending
  `TreatyInjected` (empty marker interface).
- `RouteDecl` carries the binding tuple as a `const`-generic, and
  `ManifestShape` length-checks it against
  `StripInjected<Parameters<M>>["length"]` — a binding that doesn't match the
  method's transport arity fails at compile time (the drift test re-checks it
  against decorator metadata at runtime).

### Marking injected params (annotations only, decorators untouched)

In `packages/api/src/shared/presentation/http/`:

- `type ServerReq = FastifyRequest & TreatyInjected`
- `type ServerReply = FastifyReply & TreatyInjected`
- `type CurrentIdentity = SessionUser & TreatyInjected`

Controllers annotate injected params with these aliases: auth (`@Req`, `@Res`,
×several), blog (`@CurrentUser` ×3), user (×1), media (×2). Four controller
files plus the shared aliases module, zero behavior change.

## Runtime client

`treaty(origin, appRoutes)` builds plain nested functions from manifest data:

1. Substitute `:name` URL segments from args at `param` positions (in order),
   `encodeURIComponent` each.
2. Append `query`-position args as search params (none exist today; cheap).
3. `body`-position arg → `JSON.stringify` + `Content-Type: application/json`.
4. `credentials: "include"`.
5. `!res.ok` → parse problem+json → `throw new ApiError(status, code,
message)`; unknown bodies default `code: "Unknown"`,
   `message: res.statusText` — byte-for-byte today's `client.ts` semantics.
6. `204`/`205` → `undefined`; otherwise `res.json()`.

## Drift guard — `packages/api/src/bootstrap/app-routes.test.ts`

Boots no server. Scans `AppModule`'s controllers with `@nestjs/core`
`MetadataScanner` + reflect-metadata constants (`PATH_METADATA`,
`METHOD_METADATA`, route-args metadata) into the real route table
`{ path, verb, controller method name, arg kinds }`, and deep-equals it
against the manifest. A path typo, missing route, changed verb, or reordered
params turns the test red. The one duplicated fact cannot drift silently.

## Web cutover (clean; no shims)

- Delete `apps/web/src/shared/api/{client,post,user}.ts`.
- New `apps/web/src/shared/api/api.ts`:
  `export const api = treaty(API_ORIGIN, appRoutes)` + `ApiError` re-export;
  `index.ts` re-exports updated.
- Rewrite callers to `api.blog.*` / `api.auth.*` / `api.media.*` /
  `api.user.me()`: `features/manage-posts/api/{post-api,post-queries,
post-mutations,upload-image}.ts`, auth-page, blog-page, admin pages.
- `PostDraft`/`PostPatch`/`Post`/`User` interfaces deleted; bare response
  types via `TreatyResponse<AppTreaty, "blog", "getBySlug">` where needed.
- `apps/web/package.json`: add `"@nest-mono/api": "workspace:*"`.
- `packages/api/package.json`: add `"./treaty": "./src/bootstrap/app-routes.ts"`
  to exports.

## Testing

- `packages/treaty`: unit tests with stubbed `fetch` — URL templating,
  param/query/body binding order, error mapping, 204 → `undefined`. The
  package is the durable artifact; it earns tests.
- `packages/api`: drift-guard test above; one smoke test boots `createApp` on
  an ephemeral port and round-trips `getBySlug` through the real treaty
  client (needs DB — run under the repo's existing test env).
- `apps/web`: `check-types` green is the end-to-end inference proof; existing
  `bun test apps packages` stays green.

## Limitations (documented)

- Overloaded controller methods: last overload wins (none exist today).
- `binding` must mirror decorator order; the drift test catches mismatch.
- v1 ignores `@Headers`/`@Ip`/custom transport decorators (none used).
- Client input types are the controllers' declared param types — e.g.
  `CreatePostBody` is `z.infer` (post-default output), so `content` is
  required client-side. Mirrors server truth; unchanged behavior.
