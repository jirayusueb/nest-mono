import { RuleTester } from "oxlint/plugins-dev";

import { noIllegalLayerImportsRule } from "./no-illegal-layer-imports.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

// dirname depths: FEATURE_*/SHARED_* files sit at /src/<4 segments>/<file>;
// "../../.." from a feature layer subdir reaches /src/features, "../../../.."
// reaches /src. SHARED_* files at /src/shared/<2 segments> need "../.." for
// /src/shared and "../../.." for /src.
const FEATURE_DOMAIN = "/src/features/auth/domain/entities/x.ts";
const FEATURE_DOMAIN_FILE = "/src/features/auth/domain/x.ts";
const FEATURE_APPLICATION = "/src/features/auth/application/usecases/x.ts";
const FEATURE_INFRA = "/src/features/auth/infrastructure/repositories/x.ts";
const FEATURE_PRESENTATION = "/src/features/auth/presentation/http/x.ts";
const FEATURE_ROOT = "/src/features/auth/auth.module.ts";
const SHARED_KERNEL = "/src/shared/kernel/types/x.ts";
const SHARED_APPLICATION = "/src/shared/application/interfaces/x.ts";
const SHARED_PRESENTATION = "/src/shared/presentation/http/x.ts";

tester.run("anti-slop/no-illegal-layer-imports", noIllegalLayerImportsRule, {
	valid: [
		// domain: same-feature domain + shared/kernel only
		{
			code: 'import type { UserId } from "../../../../shared/kernel/types/ids";',
			filename: FEATURE_DOMAIN,
		},
		{
			code: 'import { SessionEntity } from "./session-entity";',
			filename: FEATURE_DOMAIN,
		},
		{
			code: 'import { fakeTokenHash } from "../testing/fake-token-hash";',
			filename: "/src/features/auth/domain/entities/session-entity.test.ts",
		},
		// application: domain, shared/kernel, shared/application
		{
			code: 'import { SessionEntity } from "../../domain/entities/session-entity";',
			filename: FEATURE_APPLICATION,
		},
		{
			code: 'import { make } from "../../../../shared/kernel/types/brand";',
			filename: FEATURE_APPLICATION,
		},
		{
			code: 'import type { ILogger } from "../../../../shared/application/interfaces/i-logger";',
			filename: FEATURE_APPLICATION,
		},
		// infrastructure: application ports, db schema
		{
			code: 'import type { ISessionRepository } from "../../application/ports/i-session-repository";',
			filename: FEATURE_INFRA,
		},
		{
			code: 'import { session } from "../../../../db/schema/auth";',
			filename: FEATURE_INFRA,
		},
		{
			code: 'import { PasswordRules } from "../../domain/rules/password-rules";',
			filename: FEATURE_PRESENTATION,
		},
		// presentation: application, domain types + UPPER_SNAKE constants, kernel runtime
		{
			code: 'import { CreateSession } from "../../application/usecases/create-session";',
			filename: FEATURE_PRESENTATION,
		},
		{
			code: 'import type { SessionEntity } from "../../domain/entities/session-entity";',
			filename: FEATURE_PRESENTATION,
		},
		{
			code: 'import { MAX_POST_TITLE_LENGTH } from "../../domain/values/post-title-vo";',
			filename: "/src/features/blog/presentation/http/x.ts",
		},
		{
			code: "import { type SessionEntity, MAX_SESSION_TTL } from \"../../domain/entities/session\";",
			filename: FEATURE_PRESENTATION,
		},
		{
			code: 'import type { Env } from "../../../../shared/infrastructure/config/env";',
			filename: FEATURE_PRESENTATION,
		},
		{
			code: 'import { ok } from "../../../../shared/kernel/types/result";',
			filename: FEATURE_PRESENTATION,
		},
		// shared outer layers: kernel only
		{
			code: 'import type { UserId } from "../../kernel/types/ids";',
			filename: SHARED_APPLICATION,
		},
		{
			code: 'import { ok } from "../../kernel/types/result";',
			filename: SHARED_PRESENTATION,
		},
		// feature root (composition root): own feature and shared unrestricted
		{
			code: 'import { DrizzleAuthRepository } from "./infrastructure/repositories/drizzle-auth-repository";',
			filename: FEATURE_ROOT,
		},
		{
			code: 'import { env } from "../../shared/infrastructure/config/env";',
			filename: FEATURE_ROOT,
		},
		// cross-feature allowlist: other feature's ports, module, type-only domain
		{
			code: 'import { USER_REPOSITORY } from "../user/application/ports/i-user-repository";',
			filename: FEATURE_ROOT,
		},
		{
			code: 'import { UserModule } from "../user/user.module";',
			filename: FEATURE_ROOT,
		},
		{
			code: 'import type { UserEntity } from "../user/domain/entities/user-entity";',
			filename: FEATURE_ROOT,
		},
		{
			code: 'import { USER_REPOSITORY } from "../../../user/application/ports/i-user-repository";',
			filename: FEATURE_INFRA,
		},
		// cross-feature port adapter at its sanctioned home
		{
			code: 'import { USER_REPOSITORY } from "../../../user/application/ports/i-user-repository";',
			filename: "/src/features/auth/infrastructure/adapters/identity-repository.adapter.ts",
		},
		// unrestricted sources and non-relative specifiers
		{
			code: 'import { DrizzleUserRepository } from "../features/auth/infrastructure/repositories/drizzle-user-repository";',
			filename: "/src/bootstrap/app.ts",
		},
		{
			code: 'import { z } from "zod";',
			filename: FEATURE_DOMAIN,
		},
		{
			code: 'import { anything } from "./somewhere";',
			filename: "/src/unrelated.ts",
		},
	],
	invalid: [
		// domain isolation (incl. cross-feature and bootstrap targets)
		{
			code: 'import { fakeTokenHash } from "../../application/testing/mocks";',
			filename: FEATURE_DOMAIN,
			errors: [{ messageId: "domainIsolation" }],
		},
		{
			code: 'import { Post } from "../../blog/domain/entities/post";',
			filename: FEATURE_DOMAIN_FILE,
			errors: [{ messageId: "domainIsolation" }],
		},
		{
			code: 'import { app } from "../../../bootstrap/app";',
			filename: FEATURE_DOMAIN_FILE,
			errors: [{ messageId: "domainIsolation" }],
		},
		{
			code: 'export { IIdentityRepository } from "../application/ports/i-identity-repository";',
			filename: FEATURE_DOMAIN_FILE,
			errors: [{ messageId: "domainIsolation" }],
		},
		{
			code: 'export * from "../application/ports/i-identity-repository";',
			filename: FEATURE_DOMAIN_FILE,
			errors: [{ messageId: "domainIsolation" }],
		},
		// kernel isolation (type-only still forbidden)
		{
			code: 'import type { ILogger } from "../../application/interfaces/i-logger";',
			filename: SHARED_KERNEL,
			errors: [{ messageId: "kernelIsolation" }],
		},
		// application isolation (type-only infra import still forbidden)
		{
			code: 'import { DrizzleUserRepository } from "../../infrastructure/repositories/drizzle-user-repository";',
			filename: FEATURE_APPLICATION,
			errors: [{ messageId: "applicationIsolation" }],
		},
		{
			code: 'import { AuthController } from "../../presentation/http/auth-controller";',
			filename: FEATURE_APPLICATION,
			errors: [{ messageId: "applicationIsolation" }],
		},
		{
			code: 'import { user } from "../../../../db/schema/users";',
			filename: FEATURE_APPLICATION,
			errors: [{ messageId: "applicationIsolation" }],
		},
		{
			code: 'import type { DrizzleUserRepository } from "../../infrastructure/repositories/drizzle-user-repository";',
			filename: FEATURE_APPLICATION,
			errors: [{ messageId: "applicationIsolation" }],
		},
		{
			code: 'import "../../infrastructure/database";',
			filename: FEATURE_APPLICATION,
			errors: [{ messageId: "applicationIsolation" }],
		},
		// infrastructure isolation
		{
			code: 'import { AuthController } from "../../presentation/http/auth-controller";',
			filename: FEATURE_INFRA,
			errors: [{ messageId: "infrastructureIsolation" }],
		},
		// presentation: runtime infra/db forbidden, type-only allowed
		{
			code: 'import { user } from "../../../../db/schema/users";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "presentationInfra" }],
		},
		{
			code: 'import { env } from "../../../../shared/infrastructure/config/env";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "presentationInfra" }],
		},
		// presentation: domain as types/constants only
		{
			code: 'import { SessionEntity } from "../../domain/entities/session-entity";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "presentationRuntime" }],
		},
		{
			code: 'import SessionEntity from "../../domain/entities/session-entity";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "presentationRuntime" }],
		},
		{
			code: 'import { sessionEntity } from "../../domain/entities/session-entity";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "presentationRuntime" }],
		},
		{
			code: 'import { MAX_SESSION_TTL, sessionEntity } from "../../domain/entities/session";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "presentationRuntime" }],
		},
		// cross-feature imports
		{
			code: 'import { CreatePost } from "../../../blog/application/usecases/create-post";',
			filename: FEATURE_PRESENTATION,
			errors: [{ messageId: "crossFeature" }],
		},
		{
			code: 'import { PostEntity } from "../../../blog/domain/entities/post";',
			filename: FEATURE_INFRA,
			errors: [{ messageId: "crossFeature" }],
		},
		{
			code: 'import { DrizzleUserRepository } from "../../../user/infrastructure/repositories/drizzle-user-repository";',
			filename: FEATURE_INFRA,
			errors: [{ messageId: "crossFeature" }],
		},
		{
			code: 'import { UserEntity } from "../../../user/domain/entities/user-entity";',
			filename: FEATURE_INFRA,
			errors: [{ messageId: "crossFeature" }],
		},
		// feature root: cross-feature beyond the allowlist
		{
			code: 'import { DrizzleUserRepository } from "../user/infrastructure/repositories/drizzle-user-repository";',
			filename: FEATURE_ROOT,
			errors: [{ messageId: "crossFeature" }],
		},
		{
			code: 'import { UserEntity } from "../user/domain/entities/user-entity";',
			filename: FEATURE_ROOT,
			errors: [{ messageId: "crossFeature" }],
		},
		{
			code: 'import { GetUser } from "../user/application/usecases/get-user";',
			filename: "/src/features/auth/identity-repository.adapter.ts",
			errors: [{ messageId: "crossFeature" }],
		},
		// stray feature-root files are policed as infrastructure, not roots
		{
			code: 'import { AuthController } from "./presentation/http/auth.controller";',
			filename: "/src/features/auth/legacy-gateway.ts",
			errors: [{ messageId: "infrastructureIsolation" }],
		},
		{
			code: 'import { IdentityRepositoryAdapter } from "../auth/identity-repository.adapter";',
			filename: "/src/features/user/user.module.ts",
			errors: [{ messageId: "crossFeature" }],
		},
		// shared never imports feature root files either
		{
			code: 'import { AuthModule } from "../../../features/auth/auth.module";',
			filename: SHARED_APPLICATION,
			errors: [{ messageId: "sharedImportsFeature" }],
		},
		// shared never imports features
		{
			code: 'import type { SessionEntity } from "../../../features/auth/domain/entities/session-entity";',
			filename: SHARED_APPLICATION,
			errors: [{ messageId: "sharedImportsFeature" }],
		},
		{
			code: 'import { SessionEntity } from "../../../features/auth/domain/entities/session-entity";',
			filename: SHARED_PRESENTATION,
			errors: [{ messageId: "sharedImportsFeature" }],
		},
	],
});
