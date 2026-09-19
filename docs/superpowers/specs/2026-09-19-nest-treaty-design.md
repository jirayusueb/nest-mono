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

The server creates one contract value — `createContract({ blog:
BlogController, ... })` with controllers as **values** — which scans their
decorator metadata at runtime into a route table AND fixes the type for the
Eden-style export: `export type AppContract = ContractOf<typeof
appContract>`. `createContract` also generates the `GET /treaty/routes`
controller that serves the live table; the client `treaty<AppContract>(
API_ORIGIN)` lazily fetches it on first call. Every method call is a typed
function whose args and response are inferred from the controller method
signatures. No manifest, no codegen, no rerun, no runtime data crossing at
build time.

Why not literally `createContract(AppModule)`: decorators add no members, so
`typeof AppModule` is an empty class type with nothing to infer from. The
controller map gives the library both the runtime scan source and the type
source in one declaration — and the export is still a pure `typeof`, exactly
like Eden's `type App = typeof app`.

## Package surface — `packages/treaty` (`@nest-mono/treaty`)

Zero runtime dependencies.

- Client: `treaty<App>(origin)` → nested callable object. First call awaits a
  single `GET /treaty/routes` fetch (cached for the origin's lifetime);
  concurrent first calls share one promise.
- `ApiError` (same shape as today's `client.ts`: `status`, `code`,
  `message`).
- Server: `createContract(map)` → `{ table, controller }` (scans controller
  metadata; `controller` serves `GET /treaty/routes`); type `ContractOf<T>`
  for the `typeof appContract` export.

Usage (web):

```ts
import type { AppContract } from "@nest-mono/api/treaty";
import { treaty } from "@nest-mono/treaty";

export const api = treaty<AppContract>(API_ORIGIN);

const post = await api.blog.getBySlug("hello"); // Promise<PostResponse>
await api.blog.update(id, patch); // [id: string, body: UpdatePostBody]
const session = await api.auth.getSessionRoute(); // Promise<GetSessionResponse | null>
```

## Server artifact — `packages/api`

### 1. Contract anchor — `src/bootstrap/contract.ts`

```ts
import { createContract } from "@nest-mono/treaty";
import { AuthController } from "../features/auth/presentation/http/auth.controller";
import { BlogController } from "../features/blog/presentation/http/blog.controller";
import { MediaController } from "../features/media/presentation/http/media.controller";
import { UserController } from "../features/user/presentation/http/user.controller";

export const appContract = createContract({
  blog: BlogController,
  auth: AuthController,
  user: UserController,
  media: MediaController,
});

export type AppContract = ContractOf<typeof appContract>;
```

`createContract` scans each controller class's own route/param metadata
(controllers carry it all — no module walk needed), builds the table, and
returns a generated Nest controller (`appContract.controller`) serving
`GET /treaty/routes`. Keys are the map's keys — explicit, no name-derived
surprises. Collision or a mapped class without route metadata → throws at
import time, loud.

Exported through a **new subpath** `"@nest-mono/api/treaty"` (root `.` export
pulls `createApp`/DB). The web imports it `import type` — fully erased.

### 2. Registration — `TreatyModule` in `src/bootstrap/`

```ts
@Module({ controllers: [appContract.controller] })
export class TreatyModule {}
```

Imported by `AppModule`. `/treaty/routes` serves the table built at import
time from the same metadata Nest serves routes with — always in sync by
construction. `HealthController` is simply not in the map. Exposes topology
only (verbs, paths, arg positions) — no schemas, no secrets; route paths are
public knowledge in this app.

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

## Guards — `packages/api/src/bootstrap/contract.test.ts`

1. Scan AppModule's controllers (minus `HealthController` and the treaty
   controller); assert the key set equals `appContract`'s map (adding a
   controller to a module without mapping it in `contract.ts` → red test).
2. Smoke: boot `createApp` on an ephemeral port, `GET /treaty/routes`,
   round-trip `api.blog.getBySlug` through the real treaty client (needs DB —
   runs under the repo's existing test env).

## Web cutover (clean; no shims)

- Delete `apps/web/src/shared/api/{client,post,user}.ts`.
- New `apps/web/src/shared/api/api.ts`: `treaty<AppContract>(API_ORIGIN)` +
  `ApiError` re-export; `index.ts` re-exports updated.
- Rewrite callers to `api.blog.*` / `api.auth.*` / `api.media.*` /
  `api.user.me()`: `features/manage-posts/api/{post-api,post-queries,
post-mutations,upload-image}.ts`, auth-page, blog-page, admin pages.
- `PostDraft`/`PostPatch`/`Post`/`User` interfaces deleted; bare response
  types via `TreatyResponse<AppContract, "blog", "getBySlug">` where needed.
- `apps/web/package.json`: add `"@nest-mono/api": "workspace:*"`.
- `packages/api/package.json`: add `"./treaty": "./src/bootstrap/contract.ts"`
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

export type ContractMap = Record<string, new (...args: never[]) => unknown>;

export type Treaty<C extends ContractMap> = {
  [K in keyof C]: ControllerApi<InstanceType<C[K]>>;
};

export type TreatyResponse<
  A,
  C extends keyof A & string,
  M extends keyof A[C] & string,
> = A[C][M] extends (...args: never[]) => infer R ? Awaited<R> : never;

/** Eden-style: `export type AppContract = ContractOf<typeof appContract>`. */
export type ContractOf<T extends { map: ContractMap }> = Treaty<T["map"]>;
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

### `packages/treaty/src/contract.ts` (server-side runtime)

```ts
export function createContract<C extends ContractMap>(map: C) {
  const table = scanControllers(map); // reads each class's route + route-args
  // metadata; transport kinds only; throws
  // on empty/colliding entries
  class ContractRoutesController {
    @Get("routes")
    table(): RouteTable {
      return table;
    }
  }
  Controller("treaty")(ContractRoutesController);
  Get("routes")(
    ContractRoutesController.prototype,
    "table",
    Object.getOwnPropertyDescriptor(
      ContractRoutesController.prototype,
      "table",
    )!,
  );

  return { map, table, controller: ContractRoutesController } satisfies {
    map: C;
    table: RouteTable;
    controller: Function;
  };
}
```

(Decorator functions are plain functions — applying them programmatically is
how the controller is generated. `scanControllers` reads the same route-args
metadata the StandardSchemaValidationPipe consumes; exact metadata constants
are pinned from `@nestjs/common` during implementation. The plan may instead
hand-write the tiny controller in `packages/api` if programmatic decoration
proves brittle — the contract surface `createContract(map) → controller` is
what's fixed here.)

### Web — `apps/web/src/shared/api/api.ts` + one query rewrite

```ts
import type { AppContract } from "@nest-mono/api/treaty";
import { treaty } from "@nest-mono/treaty";
import { API_ORIGIN } from "../config";

export const api = treaty<AppContract>(API_ORIGIN);
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
