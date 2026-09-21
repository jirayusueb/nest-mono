# Taste

How we feel about code. The lint rules are the mechanical half of taste; this
doc is the why. If a rule reads as nitpicky, read it as a value: the code it
kills is code we've been burned by.

Short version: boring code, smallest diff, delete over add, no speculative
abstractions. If a change feels clever, it's probably wrong.

## What taste means here

Good code is boring. It does the obvious thing, changes as little as it has to,
and removes more than it adds. We optimize for the person reading this in six
months, not for the moment of writing it. Every abstraction is a bet that you'll
need that flexibility — most of the time you don't, and the abstraction is
dead weight a future reader has to decode at 3am.

## The lint rules, and what each one is really for

Each rule below encodes one taste call:

- `no-illegal-layer-imports` — layers point inward; a feature that reaches into
  another feature's guts is a dependency you'll pay for forever.
- `organize-imports` — a canonical import order means diffs stay small and
  nothing hides a real change behind a reorder.
- `no-unknown-type-aliases` — `unknown` is a debt marker; if it shows up in a
  type alias you've pushed a decoding problem to a worse place.
- `no-unsafe-dictionary-type` — a dictionary whose values are `unknown`/`any`
  is a type system with the doors kicked in.
- `no-widen-then-assert` — widening a known value only to assert it back is
  theatre; the assertion proves the widening was wrong.
- `require-readable-spacing` — dense code is slow to read; breathing room is
  cheap and the reader is you, later.
- `require-safety-comment-for-type-assertion` — an `as` is a confession that
  you know better than the type system; if you do, say why.
- `no-module-mocking` — mocking the module under test means you're testing the
  mock, not the code; swap the real dependency through its interface instead.
- `no-object-parameters` — a bare object param hides its shape; name the input
  type and parse it once at the boundary.
- `no-reduce-accumulator-copy` — copying an accumulator every pass turns a
  linear loop quadratic; grow it in place or pick a better tool.
- `no-reflect-apply` — `Reflect.apply` is dynamic dispatch pretending to be
  callable; call the typed function or model the dispatch behind an interface.
- `no-reflect-get` — `Reflect.get` skips the type system; access the property
  or decode the input into a real type.
- `no-runtime-typeof` — runtime `typeof` means you never decoded at the I/O
  boundary; do it once, where the value arrives.
- `no-shape-in-symbol-names` — "shape" is a hand-wave word; if you can't name
  what it is, you don't know what it is.
- `no-unknown-parameters` — an `unknown` parameter hands the decoding problem
  to every caller; decode at the boundary instead.
- `no-unknown-returns` — a function that returns `unknown` makes its callers
  do the guessing; give it a real return type.
- `no-array-filter-map` — chained `filter().map()` walks the array twice for
  no reason; one pass is faster and reads clearer.
- `no-chained-type-assertions` — stacking `as` on `as` means you're forcing the
  type system to agree with you twice; fix the source, don't argue louder.
- `no-conditional-empty-object-spread` — spreading an empty object to "omit" a
  field is a roundabout way to build a shape; just build the shape.
- `no-known-value-widening` — flowing a known value into a broad type throws
  away the evidence you already have; keep it typed.

## Floors

These aren't style; they're non-negotiable:

- Never mock what you're testing. Mock what it talks to.
- No speculative abstractions. Add the seam when you have a second caller.
- Smallest diff that works. A smaller change is easier to review and easier to
  revert.
- Delete over add. Removing code is the highest-value edit.
