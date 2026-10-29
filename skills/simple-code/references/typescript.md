Status: draft, not measured.

# TypeScript

## Simple here looks like

Types that describe the data and then get out of the way: inferred types for locals, written types at the edges (exported function signatures, data from outside), unions of string literals for a fixed set of values, and narrowing instead of casting. Read `javascript.md` too; its rules apply to the code itself.

## Do

- Let inference work for local variables and obvious return values. Write the type where a reader would otherwise have to guess: exported functions, props, API responses.
- Describe a fixed set of values with a union of string literals.
- Use `unknown` for data you have not checked, then narrow it.
- Derive a type from one that exists (`typeof`, `ReturnType`, `Pick`, `Omit`) rather than writing a second copy.
- Follow the project's choice between `type` and `interface`, and its `tsconfig` strictness.

## Do not (what agents over-build here)

- Generics, conditional types or mapped types where a plain type does the job. Instead: the plain type; add a generic on the second real use.
- `any`, `as` casts and `!` assertions to silence an error. Instead: fix the type, or narrow the value.
- An interface for every small object that is used once. Instead: an inline type, or the project's usual declaration (`type` or `interface`) next to its use.
- An `enum` for a few values. Instead: a union of string literals, unless the project uses enums.
- An abstract class or an interface with one implementation. Instead: the concrete function or class.
- Type-level puzzles that need a comment to explain. Instead: a simpler shape, or a runtime check.

## Check before finishing

- Does each type I wrote describe real data, or does it only satisfy the compiler?
- Did I add a cast, `any` or `!`, and can I remove it by narrowing?
- Is there a generic or conditional type that a plain type would replace?
- Does the new code compile under the project's own `tsconfig` without loosening it?
