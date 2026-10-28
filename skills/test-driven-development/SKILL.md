---
name: test-driven-development
description: Use when implementing any feature, bug fix, refactor or behavior change, before writing implementation code. Write the failing test first, watch it fail, then write the minimal code to pass.
---

# Test-Driven Development

Write the test first. Watch it fail. Write the minimal code to pass. If you did not watch the test fail, you do not know it tests the right thing.

## The iron law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? Delete it and start over from the test. Do not keep it as reference and do not adapt it. Exceptions need the user's permission: throwaway prototypes, generated code, configuration files.

## What a good test is

A test verifies behavior through a public interface, not implementation details. Code can change entirely and the test should not. It reads like a specification ("user can check out with a valid cart") and survives refactors because it does not care about internal structure.

- One behavior per test, with a name that describes it. An "and" in the name means split it.
- Use real code. Mock only what you cannot avoid, and never assert on mock behavior.
- Keep test-only code in test utilities, not in production classes.
- Before writing a test, name the production change that would make it fail.

## Seams: where tests go

A seam is the public boundary you test at, where you observe behavior without reaching inside. Decide the seam before writing the test. For anything non-trivial, say which seams you will test and confirm them with the user; do not spread effort over every edge case. If the interface itself is in question, settle that first.

## Anti-patterns

- **Implementation-coupled.** Mocks internal collaborators, tests private methods, or checks results through a side channel such as querying the database. The tell is a test that breaks on a refactor with no behavior change.
- **Tautological.** The assertion recomputes the expected value the way the code does, so it passes by construction. Take expected values from an independent source: a literal, a worked example, the spec.
- **Horizontal slicing.** Writing all the tests, then all the code. Bulk tests verify imagined behavior. Work in vertical slices: one test, one implementation, repeat, each test responding to what the last cycle taught you.

## The loop

1. **Red.** Write one minimal failing test.
2. **Verify red (mandatory).** Run it. Confirm it fails, not errors, and fails for the expected reason (the feature is missing, not a typo). If it passes, you are testing existing behavior; fix the test. If it errors, fix the error and run again.
3. **Green.** Write the simplest code that passes. No extra options, no speculative features, no unrelated refactoring.
4. **Verify green (mandatory).** Run the test, then the project's whole test command, not only your file. Output must be clean. Any failure it shows goes in your report by name, including ones you did not cause.
5. **Refactor, only while green.** Remove duplication, improve names, extract helpers. Add no behavior.
6. Next failing test.

## Bug fixes

Write a test that reproduces the bug, watch it fail, fix the cause, watch it pass. Never fix a bug without a test.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks. The test takes thirty seconds. |
| "I'll write the tests after" | A test that passes at once proves nothing; you never saw it catch anything. |
| "I already tested it by hand" | Manual checks leave no record and cannot be rerun. |
| "Deleting my code is wasteful" | The time is spent either way. Untrusted code is the waste. |
| "I need to explore first" | Fine. Throw the exploration away, then start with the test. |
| "The test is hard to write" | A hard-to-test design is hard to use. Simplify the interface. |
| "TDD will slow me down" | It is faster than debugging after the fact. |

## Red flags

Stop and start over if you see: code before a test, a test that passes immediately, a failure you cannot explain, tests planned for "later", or the thought "just this once".

## Checklist before you call it done

- [ ] Every new function or method has a test.
- [ ] You watched each test fail, for the right reason, before implementing.
- [ ] The code is the minimum to pass.
- [ ] The whole suite passes with clean output.
- [ ] Edge cases and error paths are covered.
