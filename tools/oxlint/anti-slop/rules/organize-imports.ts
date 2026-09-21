import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

/**
 * Canonical leading-import layout:
 *
 *   1. node:/bun: builtins
 *   2. external packages
 *   3. @nest-mono/* workspace packages
 *   4. ~/ alias
 *   5. ./ ../ relative
 *
 * One blank line between adjacent groups, none inside a group;
 * case-insensitive alphabetical by specifier inside a group.
 * Side-effect imports (`import "x"`) are position-pinned: the section is
 * split into segments at them and only the non-side-effect segments are
 * organized. Comments attached to an import travel with it; a comment
 * separated from its following import by a blank line (e.g. a file header)
 * disables the rule for that file rather than risk moving it.
 */
export const organizeImportsRule = defineRule({
	meta: {
		type: "problem",
		fixable: "code",
		docs: {
			description:
				"Organize the leading import block: builtins → external → @nest-mono/* → ~/ → relative, blank line between groups, alphabetical within groups. Side-effect imports keep their position.",
		},
		messages: {
			notOrganized:
				"Imports are not organized: builtins → external → @nest-mono/* → ~/ → relative, blank line between groups, alphabetical within groups.",
		},
	},
	create(context) {
		const sourceCode = context.sourceCode;
		const text = sourceCode.text;

		/** Only whitespace with at most one newline between two offsets. */
		const adjacent = (from: number, to: number): boolean => {
			const between = text.slice(from, to);
			return between.trim().length === 0 && !between.includes("\n\n");
		};
		/**
		 * Start of a declaration's text: the comment block directly above it
		 * (contiguous lines, no blank line separating block from import).
		 */
		const declStart = (decl: ESTree.ImportDeclaration): number => {
			const comments = sourceCode.getCommentsBefore(decl);
			let start = decl.range[0];
			for (let i = comments.length - 1; i >= 0; i -= 1) {
				const comment = comments[i];
				if (!adjacent(comment.range[1], start)) break;
				start = comment.range[0];
			}
			return start;
		};

		/**
		 * Every comment in the import section must be attached to some import
		 * (walked from the import upwards without hitting a blank line).
		 * Unattached comments (file headers, floating notes) bail the file.
		 */
		const allCommentsAttached = (
			imports: ESTree.ImportDeclaration[],
		): boolean => {
			const attached = new Set<number>();
			for (const decl of imports) {
				const comments = sourceCode.getCommentsBefore(decl);
				let frontier = decl.range[0];
				for (let i = comments.length - 1; i >= 0; i -= 1) {
					const comment = comments[i];
					if (!adjacent(comment.range[1], frontier)) break;
					attached.add(comment.range[0]);
					frontier = comment.range[0];
				}
			}
			return imports.every((decl) =>
				sourceCode
					.getCommentsBefore(decl)
					.every((comment) => attached.has(comment.range[0])),
			);
		};

		/** End of a declaration's text: end of its line, so trailing
		 *  same-line comments travel with the import. */
		const declEnd = (decl: ESTree.ImportDeclaration): number => {
			const eol = text.indexOf("\n", decl.range[1]);
			return eol === -1 ? text.length : eol;
		};

		const groupOf = (specifier: string): number => {
			if (specifier.startsWith("node:") || specifier.startsWith("bun:"))
				return 0;
			if (specifier.startsWith("@nest-mono/")) return 2;
			if (specifier.startsWith("~/")) return 3;
			if (specifier.startsWith("./") || specifier.startsWith("../")) return 4;
			return 1;
		};

		return {
			Program(node) {
				const body = node.body;
				let count = 0;
				while (body[count]?.type === "ImportDeclaration") count += 1;
				if (count < 2) return;
				const imports = body.slice(0, count) as ESTree.ImportDeclaration[];
				if (!allCommentsAttached(imports)) return;

				// Split into position-pinned segments at side-effect imports
				// (no specifiers — `import "x"`); organize each other segment.
				const segments: { sideEffect: boolean; decls: ESTree.ImportDeclaration[] }[] =
					[];
				for (const decl of imports) {
					const last = segments[segments.length - 1];
					if (decl.specifiers.length === 0)
						segments.push({ sideEffect: true, decls: [decl] });
					else if (last && !last.sideEffect) last.decls.push(decl);
					else segments.push({ sideEffect: false, decls: [decl] });
				}

				const rebuilt = segments
					.map((segment) => {
						if (segment.sideEffect) {
							const decl = segment.decls[0];
							return text.slice(declStart(decl), declEnd(decl));
						}
						const sorted = [...segment.decls].sort((a, b) => {
							const groupDiff =
								groupOf(a.source.value) - groupOf(b.source.value);
							if (groupDiff !== 0) return groupDiff;
							const sa = a.source.value.toLowerCase();
							const sb = b.source.value.toLowerCase();
							return sa < sb ? -1 : sa > sb ? 1 : 0;
						});
						const lines: string[] = [];
						let prevGroup = -1;
						for (const decl of sorted) {
							const group = groupOf(decl.source.value);
							if (prevGroup !== -1 && group !== prevGroup) lines.push("");
							prevGroup = group;
							lines.push(text.slice(declStart(decl), declEnd(decl)));
						}
						return lines.join("\n");
					})
					.join("\n");

				const sectionStart = declStart(imports[0]);
				const sectionEnd = declEnd(imports[count - 1]);
				if (rebuilt === text.slice(sectionStart, sectionEnd)) return;

				context.report({
					node: imports[0],
					messageId: "notOrganized",
					fix: (fixer) =>
						fixer.replaceTextRange([sectionStart, sectionEnd], rebuilt),
				});
			},
		};
	},
});
