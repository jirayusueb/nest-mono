# Testing

How we test here. Short version: vitest, AAA, one behavior per test, hand-rolled
mocks. If a test is hard to write, the code under test is usually worse than the
test — fix the code first.

Tests live next to the file they cover (`create-post.test.ts` beside
`create-post.ts`). Run them with `bun test`.

## Naming

`describe` is the subject, `it` is the behavior. The `it` line reads like a
sentence someone says out loud — verb first, no "should", no method names:

```
it("suffixes the slug when it is already taken", ...)
it("rejects a short password", ...)
it("keeps the record but hides it from reads", ...)
```

- `<verb> <what> when <condition>` — use `when` for the interesting case,
  drop it when there's nothing conditional.
- No "test that...", no method names, no "works correctly". If you can't
  finish the sentence, you don't know what you're testing yet.
- Happy path first, then the ways it breaks.

## Shape: Arrange, Act, Assert

Every test is three blocks. If you need four, you're testing two things.

```ts
it("suffixes the slug when it is already taken", async () => {
  // arrange
  const { posts, useCase } = setup();
  posts.push(storedPost({ slug: SlugVO.restore("weekend-wrap") }));

  // act
  const result = await useCase.execute({
    userId: USER_ID,
    title: "Weekend Wrap",
    content: "",
    tags: [],
  });

  // assert
  expect(result.isOk()).toBe(true);
  expect(result.unwrap().slug).toBe("weekend-wrap-2");
});
```

- **Arrange** — build the world. One `setup()` call, maybe one more line to make
  it interesting.
- **Act** — one call. If you have to call twice, that's two tests.
- **Assert** — what the caller observes: the returned result, the state that
  changed. Not internals, not spy call counts.

## setup()

Each test file starts with a `setup()` that wires the subject with mocks and
returns the handles you'll poke at. Arrange then stays one or two lines.

```ts
function setup() {
  const { repo, posts } = mockPostRepository();
  const useCase = new CreatePostUseCase(
    repo,
    mockIdGenerator(),
    mockDateProvider(NOW),
    mockUnitOfWork(),
  );
  return { posts, useCase };
}
```

- Mocks are hand-rolled factories in `<scope>/application/testing/mocks.ts`
  (`shared/application/testing/mocks.ts` for cross-cutting ones like
  `mockDateProvider`). Each factory is `createMock<T>()` from
  `@golevelup/ts-vitest`, returned as `DeepMocked<T>`; where a method has real
  behavior (e.g. `mockDateProvider.now`), pass the implementation into
  `createMock({ now: () => current })`, don't fake it with `vi.fn`. No
  `vi.mock`, no `vi.fn` — there's a lint rule, don't fight it.
- Pin time (`NOW` const) and ids at the top of the file. A test that depends on
  `Date.now()` is a test that flakes.
- Never mock the thing you're testing. Mock what it talks to.

## What to test

- Use cases and domain rules — that's where the bugs live. Controllers and
  mappers get one or two tests each, not a wall.
- Test the contract: `result.isOk()` / `result.unwrap()`, or the exact error.
  Not how the sausage was made inside.
- Every `rejects...` test should assert the error the caller actually sees, not
  just that it failed.
- A test earns its place by failing on a real bug. If you can't name the bug it
  catches, delete it.

## What not to do

- No snapshot tests. Read the assertion or don't assert.
- No setup hierarchies or `beforeEach` pyramids — `setup()` per test, inline.
- No testing private methods by casting. If you need it, promote the behavior or
  test it through the public surface.
- Don't mock the database for repository tests. Those are the point.
