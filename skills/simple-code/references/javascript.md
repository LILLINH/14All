Status: draft, not measured.

# JavaScript

## Simple here looks like

Plain functions that take values and return values, modules that export a few named functions, `async`/`await` for asynchronous work, and the platform's own features before any package. A reader can follow a file top to bottom without opening three others.

## Do

- Write a function before a class. Use a class only for something that holds state and has several behaviours that belong together.
- Keep a function to one job and name it for that job. Return early for the unusual case, then write the main path unindented.
- Use `try/catch` only where you can do something about the error.
- Reach for what the platform has first: `Array` methods, `Object.entries`, `Map` and `Set`, `Intl`, `URL`, `fetch`, `structuredClone`.
- Use `const`; use `let` only when the value really changes.
- Keep code used by one caller next to that caller. Move it to a shared module on the second real use.
- Match the project's module system (ES modules or CommonJS), quotes and semicolons. Do not mix them.

## Do not (what agents over-build here)

- A class, or a factory that returns an object of methods, for what one function does. Instead: a function.
- A `utils` or `helpers` module for one caller. Instead: a function in the file that uses it.
- `.then` nested inside `.then`, or a `Promise.all` wrapper that adds nothing. Instead: sequential `await`, and `Promise.all` only for independent calls.
- Clever one-liners: nested ternaries, long `reduce` chains that build objects, destructuring with defaults several levels deep. Instead: a `for...of` loop or two named steps.
- A package for what the platform does (a utility library for `map` and `filter`, a date library to format one date, an HTTP client for one `fetch`). Instead: the built-in, unless the project already depends on the package.
- A `try/catch` around every call that logs and rethrows. Instead: let the error travel to the place that handles it.

## Check before finishing

- Could a function replace this class or helper?
- Does the platform or the project already cover what I added a package or module for?
- Can I read each function once, top to bottom, and say what it does in one sentence?
- Did I match the project's module system, quoting and semicolons?
