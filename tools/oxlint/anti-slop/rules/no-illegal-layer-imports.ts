import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

const FEATURE_PATH_RE =
	/(?:^|\/)features\/([a-z0-9-]+)\/(domain|application|infrastructure|presentation)(?:\/|$)/u;
const SHARED_PATH_RE =
	/(?:^|\/)shared\/(kernel|application|infrastructure|presentation)(?:\/|$)/u;
const BOOTSTRAP_PATH_RE = /(?:^|\/)bootstrap\//u;
const DB_PATH_RE = /(?:^|\/)db\//u;
// UPPER_SNAKE names and the repo's *Rules constant-namespace idiom
// (NameRules, PasswordRules, ...) approximate "constant imports", which the
// guide allows into presentation. Lint cannot see constness.
const DOMAIN_CONSTANT_RE = /^(?:[A-Z][A-Z0-9_]+|[A-Z][A-Za-z0-9]*Rules)$/u;

type FeatureLayer = "domain" | "application" | "infrastructure" | "presentation";
type SharedLayer = "kernel" | FeatureLayer;

type Classified =
	| { kind: "feature"; feature: string; layer: FeatureLayer }
	| { kind: "shared"; layer: SharedLayer }
	| { kind: "bootstrap" }
	| { kind: "db" }
	| { kind: "unclassified" };

type RuntimeKinds = { hasRuntime: boolean; hasNonConstRuntime: boolean };

const ALL_TYPE: RuntimeKinds = { hasRuntime: false, hasNonConstRuntime: false };
const ALL_RUNTIME: RuntimeKinds = { hasRuntime: true, hasNonConstRuntime: true };

function classifyPath(path: string): Classified {
	const feature = FEATURE_PATH_RE.exec(path);
	if (feature) {
		return { kind: "feature", feature: feature[1]!, layer: feature[2] as FeatureLayer };
	}
	const shared = SHARED_PATH_RE.exec(path);
	if (shared) return { kind: "shared", layer: shared[1] as SharedLayer };
	if (BOOTSTRAP_PATH_RE.test(path)) return { kind: "bootstrap" };
	if (DB_PATH_RE.test(path)) return { kind: "db" };
	return { kind: "unclassified" };
}

/** Textually resolve a relative specifier against the importing file's directory. */
function resolveSpecifier(dir: string, specifier: string): string {
	const parts = `${dir}/${specifier}`.split("/");
	const out: string[] = [];
	for (const part of parts) {
		if (part === "" || part === ".") continue;
		if (part === "..") out.pop();
		else out.push(part);
	}
	return `/${out.join("/")}`;
}

function label(c: Classified): string {
	switch (c.kind) {
		case "feature":
			return `features/${c.feature}/${c.layer}`;
		case "shared":
			return `shared/${c.layer}`;
		case "bootstrap":
			return "bootstrap";
		case "db":
			return "db";
		default:
			return "unclassified";
	}
}

/** The layer of a feature/shared target; `undefined` for bootstrap/db. */
function targetLayer(c: Classified): FeatureLayer | SharedLayer | undefined {
	return c.kind === "feature" || c.kind === "shared" ? c.layer : undefined;
}

function getImportedName(specifier: ESTree.ImportSpecifier): string {
	if (specifier.imported.type === "Identifier") return specifier.imported.name;
	return specifier.imported.value;
}

function importRuntimeKinds(node: ESTree.ImportDeclaration): RuntimeKinds {
	if (node.importKind === "type") return ALL_TYPE;
	if (node.specifiers.length === 0) return ALL_RUNTIME; // side-effect import
	let hasRuntime = false;
	let hasNonConstRuntime = false;
	for (const specifier of node.specifiers) {
		if (specifier.type === "ImportSpecifier" && specifier.importKind === "type") continue;
		hasRuntime = true;
		const isConstNamed =
			specifier.type === "ImportSpecifier" && DOMAIN_CONSTANT_RE.test(getImportedName(specifier));
		if (!isConstNamed) hasNonConstRuntime = true;
	}
	return { hasRuntime, hasNonConstRuntime };
}

type Violation = { messageId: string; data: Record<string, string> };

/**
 * Dependency rules from clean-architecture-guide.md §3: dependencies point
 * inward (presentation/application → domain), shared/kernel is importable by
 * everything, shared outer layers never import features, features never import
 * each other, bootstrap/db are roots.
 */
function evaluate(
	source: Classified,
	target: Classified,
	runtime: RuntimeKinds,
): Violation | null {
	const targetLabel = label(target);

	if (source.kind === "feature" && source.layer === "domain") {
		const allowed =
			(target.kind === "feature" &&
				target.feature === source.feature &&
				target.layer === "domain") ||
			(target.kind === "shared" && target.layer === "kernel");
		return allowed ? null : { messageId: "domainIsolation", data: { target: targetLabel } };
	}

	if (source.kind === "shared" && source.layer === "kernel") {
		if (target.kind === "shared" && target.layer === "kernel") return null;
		return { messageId: "kernelIsolation", data: { target: targetLabel } };
	}

	if (source.kind === "shared" && target.kind === "feature") {
		return {
			messageId: "sharedImportsFeature",
			data: { target: targetLabel, to: target.feature },
		};
	}

	if (
		source.kind === "feature" &&
		target.kind === "feature" &&
		target.feature !== source.feature
	) {
		return {
			messageId: "crossFeature",
			data: { target: targetLabel, from: source.feature, to: target.feature },
		};
	}

	const layer = source.layer;

	if (layer === "application") {
		const outward =
			target.kind === "db" ||
			targetLayer(target) === "infrastructure" ||
			targetLayer(target) === "presentation";
		return outward
			? { messageId: "applicationIsolation", data: { target: targetLabel } }
			: null;
	}

	if (layer === "infrastructure") {
		return targetLayer(target) === "presentation"
			? { messageId: "infrastructureIsolation", data: { target: targetLabel } }
			: null;
	}

	if (layer === "presentation") {
		if (target.kind === "db" || targetLayer(target) === "infrastructure") {
			// Type-only imports are allowed: no runtime coupling (e.g. Env config type).
			return runtime.hasRuntime
				? { messageId: "presentationInfra", data: { target: targetLabel } }
				: null;
		}
		if (target.kind === "feature" && target.layer === "domain") {
			// Types and UPPER_SNAKE constants are allowed; runtime values are not.
			return runtime.hasNonConstRuntime
				? { messageId: "presentationRuntime", data: { target: targetLabel } }
				: null;
		}
		return null;
	}

	return null;
}

export const noIllegalLayerImportsRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description:
				"Enforce clean-architecture layer boundaries in packages/api/src: inward-only dependencies, no cross-feature imports, shared never imports features (clean-architecture-guide.md §3).",
		},
		messages: {
			domainIsolation:
				"Domain imports nothing outerward: '{{target}}' is outside the domain. Allowed: same-feature domain and shared/kernel only.",
			kernelIsolation:
				"Shared kernel must stay dependency-free; '{{target}}' is outside the kernel.",
			applicationIsolation:
				"Application must not import '{{target}}'; depend on domain and ports — infrastructure implements them.",
			infrastructureIsolation: "Infrastructure must not import '{{target}}'.",
			presentationInfra:
				"Presentation must not runtime-import '{{target}}'; depend on application ports (type-only imports are allowed).",
			presentationRuntime:
				"Presentation may import domain '{{target}}' as types/constants only; this runtime import couples transport to domain logic.",
			crossFeature:
				"Feature '{{from}}' must not import feature '{{to}}'; share through application ports or the shared kernel.",
			sharedImportsFeature:
				"Shared code must not import feature '{{to}}'; features depend on shared, never the reverse.",
		},
	},
	create(context) {
		const filename = context.filename.replaceAll("\\", "/");
		const source = classifyPath(filename);
		// bootstrap, db, and files outside packages/api/src are unrestricted.
		if (source.kind !== "feature" && source.kind !== "shared") return {};
		const dir = filename.slice(0, filename.lastIndexOf("/"));

		const check = (
			specifier: string,
			runtime: RuntimeKinds,
			node: ESTree.Literal,
		): void => {
			if (!specifier.startsWith("./") && !specifier.startsWith("../")) return;
			const target = classifyPath(resolveSpecifier(dir, specifier));
			if (target.kind === "unclassified") return;
			const violation = evaluate(source, target, runtime);
			if (violation) {
				context.report({ node, messageId: violation.messageId, data: violation.data });
			}
		};

		return {
			ImportDeclaration(node) {
				check(node.source.value, importRuntimeKinds(node), node.source);
			},
			ExportNamedDeclaration(node) {
				if (!node.source) return;
				check(
					node.source.value,
					node.exportKind === "type" ? ALL_TYPE : ALL_RUNTIME,
					node.source,
				);
			},
			ExportAllDeclaration(node) {
				check(
					node.source.value,
					node.exportKind === "type" ? ALL_TYPE : ALL_RUNTIME,
					node.source,
				);
			},
		};
	},
});
