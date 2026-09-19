# @nest-mono/treaty — Eden-style typesafety for vanilla NestJS

Date: 2026-09-19 (rev 3: runtime route endpoint, zero declarations, zero codegen)
Status: revised design, awaiting user review

## Problem

The web app re-declares every API shape by hand. `apps/web/src/shared/api/`
duplicates `PostResponse` as `Post`, `CreatePostBody` as `PostDraft`,
`UpdatePostBody` as `PostPatch`, `UserResponse` as `User`, and every call
re-states its generic (`apiFetch<{ posts: Post[] }>`). Server DTO changes drift
silently until runtime. We want the Elysia Eden property — frontend types flow
from the server source with zero codegen — against **pure vanilla NestJS
controllers**, untouched, and Eden's exact usage shape: pass a type, an
origin, call methods.

## Why not the existing options

- **ts-rest** (contract-first): moves shapes into a separate contract DSL;
  controllers stop being vanilla.
- **OpenAPI codegen**: type codegen from annotations, emit/serve drift.
- **Hand-written route manifest** (rev 1): every route declared twice.
- **Generated route-data file** (rev 2): kills the hand declarations but adds
  a regen step; user decision — usage must be exactly like Eden, no build
  step.

## Design in one paragraph

The server exports a **type-only anchor** (`AppTreaty`, the Eden equivalent
of `type App = typeof app`) and serves a tiny **live route-table endpoint**
(`GET /treaty/routes`) derived from AppModule's own reflect-metadata at
request time. The client is `treaty<AppTreaty>(API_ORIGIN)` — lazily fetches
the table on first call, then every method call is a typed function whose
args and response are inferred from the controller method signatures. No
manifest, no codegen, no rerun, no runtime data crossing at build time.

## Package surface — `packages/treaty` (`@nest-mono/treaty`)

Zero runtime dependencies.

- Client: `treaty<App>(origin)` → nested callable object. First call awaits a
  single `GET /treaty/routes` fetch (cached for the origin's lifetime);
  concurrent first calls share one promise.
- `ApiError` (same shape as today's `client.ts`: `status`, `code`,
  `message`).
- Types: `Treaty<C>` (client type from a controller map), `TreatyInjected`
  (marker interface), `TreatyResponse<App, controller, method>` for bare
  response annotations (queryOptions, props).

Usage (web):

```ts
import type { AppTreaty } from "@nest-mono/api/treaty";
import { treaty } from "@nest-mono/treaty";

export const api = treaty<AppTreaty>(API_ORIGIN);

const post = await api.blog.getBySlug("hello"); // Promise<PostResponse>
await api.blog.update(id, patch); // [id: string, body: UpdatePostBody]
const session = await api.auth.getSessionRoute(); // Promise<GetSessionResponse | null>
```

## Server artifact — `packages/api`

### 1. Type anchor — `src/bootstrap/treaty.ts` (type-only, ~10 lines)

```ts
import type { BlogController } from "../features/blog/presentation/http/blog.controller";
// ... type-only imports, one per controller

export type AppTreaty = Treaty<{
  blog: typeof BlogController;
  auth: typeof AuthController;
  user: typeof UserController;
  media: typeof MediaController;
}>;
```

Exported through a **new subpath** `"@nest-mono/api/treaty"` (root `.` export
pulls `createApp`/DB; the anchor imports nothing at runtime). This file is
the Nest analog of Eden's `type App = typeof app` — updated only when a
controller is added or removed (never when routes/shapes change), and a test
guards it (below).

### 2. Route-table endpoint — `TreatyRoutesController` in AppModule

`GET /treaty/routes` → JSON table built **at request time** by scanning
AppModule's reflect-metadata (module-graph walk over `imports`, collecting
`controllers`, then per controller: verb + joined path from route metadata,
and per declared param its `{ index, kind, name }` from route-args metadata —
the same metadata the StandardSchemaValidationPipe reads). Only transport
kinds (`param`/`query`/`body`) are emitted:

```jsonc
{ "blog": { "getBySlug": { "verb": "GET", "path": "/api/posts/:slug",
             "args": [{ "pos": 0, "kind": "param", "name": "slug" }] },
             "update": { "verb": "PATCH", "path": "/api/posts/:id",
             "args": [{ "pos": 0, "kind": "param", "name": "id" }, { "pos": 1, "kind": "body" }] }, ... },
  "auth": {...}, "user": {...}, "media": {...} }
```

- Excludes `HealthController` and itself (explicit list).
- Client keys: class name minus `Controller`, camel-cased; collision → the
  endpoint build throws (server-side, loud).
- Always in sync by construction — it reads live metadata; no freshness
  concept exists.
- Exposes topology only (verbs, paths, arg positions) — no schemas, no
  secrets; route paths are public knowledge in this app.

### 3. Injected-param markers (annotation-only; decorators untouched)

Without compile-time route data, injected params (`@Req`, `@Res`,
`@CurrentUser`) can't be stripped positionally, so their _type annotations_
reference marker aliases in `src/shared/presentation/http/`:

- `type ServerReq = FastifyRequest & TreatyInjected`
- `type ServerReply = FastifyReply & TreatyInjected`
- `type CurrentIdentity = SessionUser & TreatyInjected`

Applied in four controllers: auth (`@Req`/`@Res` ×several), blog
(`@CurrentUser` ×3), user (×1), media (×2). Zero behavior change. Forgetting
to mark a new injected param surfaces instantly — the client signature would
demand an unconstructible `FastifyRequest` at the call site. Self-correcting;
no test needed for it.

## Type mechanics

```ts
type Treaty<C> = {
  [K in keyof C]: {
    [M in MethodNames<InstanceType<C[K]>>]: (
      ...args: StripInjected<Parameters<InstanceType<C[K]>[M]>>
    ) => Promise<Awaited<ReturnType<InstanceType<C[K]>[M]>>>;
  };
};
```

- `MethodNames` = declared public methods of the instance type (`keyof`
  already excludes `constructor`/`Object.prototype`). Convention (true of all
  4 controllers today): controllers are route-only; a public helper would
  appear in the client type and be visible immediately.
- `StripInjected` recursively filters tuple elements extending
  `TreatyInjected`; positional labels preserved where TS allows.
- Response is the controller's own declared return type — nothing is ever
  re-declared or generated.

## Runtime client semantics

Each call: await cached table → resolve `{verb, path, args}` →

1. Substitute `:name` segments from args at `param` positions (caller args
   map 1:1 onto `args` in ascending `pos` order), `encodeURIComponent` each.
2. `query` args append as search params (`name`-less → object spread).
3. `body` args → `JSON.stringify` + `Content-Type: application/json`.
4. `credentials: "include"`.
5. `!res.ok` → parse problem+json → `throw new ApiError(status, code,
message)`; unknown bodies default `code: "Unknown"`, `message:
res.statusText` — byte-for-byte today's `client.ts` semantics.
6. `204`/`205` → `undefined`; otherwise `res.json()`.

Table-fetch failure (server down, non-200, malformed JSON) rejects the call
with the same `ApiError` machinery.

## Guards — `packages/api/src/bootstrap/treaty.test.ts`

1. Scan AppModule controllers; assert the key set equals the anchor's
   controller map (adding a controller without updating `treaty.ts` → red
   test).
2. Smoke: boot `createApp` on an ephemeral port, `GET /treaty/routes`,
   round-trip `api.blog.getBySlug` through the real treaty client (needs DB —
   runs under the repo's existing test env).

## Web cutover (clean; no shims)

- Delete `apps/web/src/shared/api/{client,post,user}.ts`.
- New `apps/web/src/shared/api/api.ts`: `treaty<AppTreaty>(API_ORIGIN)` +
  `ApiError` re-export; `index.ts` re-exports updated.
- Rewrite callers to `api.blog.*` / `api.auth.*` / `api.media.*` /
  `api.user.me()`: `features/manage-posts/api/{post-api,post-queries,
post-mutations,upload-image}.ts`, auth-page, blog-page, admin pages.
- `PostDraft`/`PostPatch`/`Post`/`User` interfaces deleted; bare response
  types via `TreatyResponse<AppTreaty, "blog", "getBySlug">` where needed.
- `apps/web/package.json`: add `"@nest-mono/api": "workspace:*"`.
- `packages/api/package.json`: add `"./treaty": "./src/bootstrap/treaty.ts"`
  to exports.

## Reference implementation (examples; the plan productionizes these)

### `packages/treaty/src/types.ts`

```ts
/** Marker for params the server injects; stripped from client signatures. */
export interface TreatyInjected {}

type AnyFn = (...args: never[]) => unknown;

type MethodNames<I> = {
  [K in keyof I]-?: I[K] extends AnyFn ? K : never;
}[keyof I];

type StripInjected<T extends unknown[]> = T extends [infer H, ...infer R]
  ? H extends TreatyInjected
    ? StripInjected<R>
    : [H, ...StripInjected<R>]
  : [];

type ControllerApi<I> = {
  [M in MethodNames<I> & string]: (
    ...args: StripInjected<Parameters<I[M]>>
  ) => Promise<Awaited<ReturnType<I[M]>>>;
};

export type Treaty<
  C extends Record<string, new (...args: never[]) => unknown>,
> = {
  [K in keyof C]: ControllerApi<InstanceType<C[K]>>;
};

export type TreatyResponse<
  A,
  C extends keyof A & string,
  M extends keyof A[C] & string,
> = A[C][M] extends (...args: never[]) => infer R ? Awaited<R> : never;
```

### `packages/treaty/src/client.ts`

```ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type RouteArg = {
  pos: number;
  kind: "param" | "query" | "body";
  name?: string;
};
type Route = { verb: string; path: string; args: RouteArg[] };
type RouteTable = Record<string, Record<string, Route>>;

export function treaty<Api>(origin: string): Api {
  let table: Promise<RouteTable> | undefined;
  const load = () =>
    (table ??= fetch(`${origin}/treaty/routes`, {
      credentials: "include",
    }).then(async (res) => {
      if (!res.ok)
        throw new ApiError(res.status, "Unknown", "route table unavailable");
      return res.json() as Promise<RouteTable>;
    }));

  const call = async (ctrl: string, method: string, callArgs: unknown[]) => {
    const route = (await load())[ctrl]?.[method];
    if (!route)
      throw new ApiError(0, "Unknown", `unknown route ${ctrl}.${method}`);
    let path = route.path;
    const query = new URLSearchParams();
    let body: unknown;
    route.args.forEach((spec, i) => {
      const value = callArgs[i]; // caller args align to args[] by ascending pos
      if (spec.kind === "param")
        path = path.replace(`:${spec.name}`, encodeURIComponent(String(value)));
      else if (spec.kind === "query" && spec.name)
        query.set(spec.name, String(value));
      else if (spec.kind === "query")
        for (const [k, v] of Object.entries(value as object))
          query.set(k, String(v));
      else body = value;
    });
    const qs = query.size ? `?${query}` : "";
    const res = await fetch(`${origin}${path}${qs}`, {
      method: route.verb,
      credentials: "include",
      ...(body !== undefined && {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    });
    if (!res.ok) {
      const problem = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };
      throw new ApiError(
        res.status,
        problem.code ?? "Unknown",
        problem.message ?? res.statusText,
      );
    }
    return res.status === 204 || res.status === 205 ? undefined : res.json();
  };

  return new Proxy({} as Api, {
    get: (_, ctrl: string) =>
      new Proxy(
        {},
        {
          get:
            (_, method: string) =>
            (...args: unknown[]) =>
              call(ctrl, method, args),
        },
      ),
  });
}
```

### `packages/api/src/shared/presentation/http/treaty-injected.ts`

```ts
import type { FastifyReply, FastifyRequest } from "fastify";
import type { TreatyInjected } from "@nest-mono/treaty";
import type { SessionUser } from "../../kernel/types/session-user";

export type ServerReq = FastifyRequest & TreatyInjected;
export type ServerReply = FastifyReply & TreatyInjected;
export type CurrentIdentity = SessionUser & TreatyInjected;
```

Controller change (annotation only — blog `update`):

```ts
async update(
  @Param("id", { schema: idSchema }) id: string,
  @Body({ schema: updatePostSchema }) body: UpdatePostBody,
  @CurrentUser() identity: CurrentIdentity,   // was SessionUser
): Promise<PostResponse>
```

### `packages/api/src/bootstrap/treaty-routes.controller.ts`

```ts
@Controller("treaty")
export class TreatyRoutesController {
  /** Served from live AppModule metadata; never stale by construction. */
  @Get("routes")
  table(): RouteTable {
    return scanRoutes(AppModule, {
      exclude: [HealthController, TreatyRoutesController],
    });
  }
}
```

`scanRoutes` walks `Reflect.getMetadata("imports", M)` / `("controllers", M)`
recursively, derives keys from class names, and reads each method's route
and route-args metadata (the same source the StandardSchemaValidationPipe
consumes), emitting transport args only. Exact metadata constants are
pinned from `@nestjs/common` during implementation.

### Web — `apps/web/src/shared/api/api.ts` + one query rewrite

```ts
import type { AppTreaty } from "@nest-mono/api/treaty";
import { treaty } from "@nest-mono/treaty";
import { API_ORIGIN } from "../config";

export const api = treaty<AppTreaty>(API_ORIGIN);
export { ApiError } from "@nest-mono/treaty";
```

```ts
// features/manage-posts/api/post-queries.ts — no hand-written generics left
export const POST_QUERIES = {
  list: () =>
    queryOptions({
      queryKey: ["posts"] as const,
      queryFn: () => api.blog.list(), // Promise<{ posts: PostResponse[] }>
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: ["posts", "detail", slug] as const,
      queryFn: () => api.blog.getBySlug(slug),
    }),
};
```

## Testing

- `packages/treaty`: unit tests with stubbed `fetch` — table fetch/caching,
  URL templating, param/query/body binding, error mapping, 204 → `undefined`.
- `packages/api`: the two guards above.
- `apps/web`: `check-types` green is the end-to-end inference proof; existing
  `bun test apps packages` stays green.

## Limitations (documented)

- First call per origin pays one extra roundtrip (table fetch, then cached).
- The client's method-keyed RPC (`api.blog.getBySlug`) is the honest Nest
  analog of Eden's treaty; Eden's literal URL-proxy syntax requires path
  types that vanilla decorators cannot provide (settled in brainstorming).
- `/treaty/routes` exposes route topology; acceptable here, revisit if routes
  ever become sensitive.
- Overloaded controller methods: last overload wins (none exist today).
- v1 ignores `@Headers`/`@Ip` transport kinds (none used).
- Client input types are the controllers' declared param types — e.g.
  `CreatePostBody` is `z.infer` (post-default output), so `content` is
  required client-side. Mirrors server truth; unchanged behavior.
