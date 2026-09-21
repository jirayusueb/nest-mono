<!--
Title = the "what": `<type>(<scope>): <description>`, under 80 chars.
Types follow commitlint (feat, fix, docs, chore, refactor, perf, ci, test).
Scope = app/package name in this monorepo (e.g. `feat(web):`, `fix(ui):`).
A reviewer must understand the PR from the title alone. Link issues here,
not in the title. — Looks Good To Me, §2.3.1
-->

## Why

<!-- Context & justification — always fill this in. Why is this change being
made, why this approach over a more obvious one, relevant decisions or
conversations that shaped it. The bulk of the description. -->

## What changed

<!-- Meaningful changes as bullets. For features, include the use case /
happy path this enables. -->

## How to test

<!-- Steps a reviewer can follow to confirm the change works as intended.
For bug fixes: root cause, reproduction steps (before), and how to confirm
the fix (after). These steps double as acceptance criteria. -->

1.
2.

## Breaking changes

<!-- Only for breaking changes — delete otherwise.
List affected apps/packages and the migration or deprecation steps
consumers must take. Migration steps are non-negotiable if the previous
behavior stops working. -->

## Screenshots

<!-- Before/after for visual or customer-facing changes — delete otherwise. -->

Closes #

## Checklist

- [ ] Title has a type prefix and is under 80 characters
- [ ] Description explains the "why"; a reviewer needs no extra digging
- [ ] Verified locally by following the steps above
- [ ] Tests cover the new behavior — every bug fix ships a regression test
- [ ] Docs updated (required for features and breaking changes)
