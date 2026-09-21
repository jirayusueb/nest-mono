# Review checklist

For reviewers. You hold the influence and you own what passes through your
review — no skim-approving. Scrutinize the code, never the author.
— _Looks Good To Me_, §2.4.1

## First pass

- [ ] Read the title and description before the diff — the title alone should tell you what this PR is
- [ ] The PR is one logical piece of behavior (if not, ask for it to be split)
- [ ] The code matches the context stated in the description and fulfills the acceptance criteria
- [ ] I can follow the "How to test" steps from the PR description

## The code

- [ ] **Complexity** — I understand it and it flows logically; nothing I re-read out of confusion; no "temporary" workarounds
- [ ] **Consistency** — follows patterns already in the codebase; reuses existing code/libraries instead of re-inventing
- [ ] **Conventions** — matches [naming.md](../docs/naming.md) and the [clean architecture guide](../clean-architecture-guide.md)
- [ ] **Edge cases** — scenarios the author seems to have forgotten; history or nuance I know that wasn't considered
- [ ] **Error handling** — errors and edge cases handled consistently with the rest of the codebase
- [ ] **Security** — no vulnerabilities automated checks can't catch
- [ ] **Tests** — new behavior is covered; every bug fix has a regression test
- [ ] **Docs** — updated where the change affects them
- [ ] **The larger picture** — the change fits the system as a whole, not just this PR

## Blocking vs. nitpicks (§3.3.3)

**Request changes only for:** unmet core functionality, security issues, major
deviations from team conventions, code smells, regressions, performance
problems, failing tests.

**Never block on:** personal style preferences, minor formatting, doc
nitpicks, missing optional features, minor refactor opportunities, unrelated
improvements. Prefix those comments with `nit:` and suggest a separate PR.

## Comments (§6.1)

- [ ] Objective — about the code, backed by a convention, standard, or missing context; preferences are labeled as such
- [ ] Specific — points at an exact line and names the problem
- [ ] Focused outcome — states what to change and why, not an open-ended musing
- Multi-part or nuanced feedback → talk to the author directly instead of writing a novel
- Leave a compliment when the code earns it (§6.3)
