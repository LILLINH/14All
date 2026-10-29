Status: draft, not measured.

# Go

## Simple here looks like

Concrete types and plain functions, small packages named for what they hold, errors returned and handled by the caller, `for` loops, and the standard library. Code that reads the same way in every file of the project.

## Do

- Use concrete types. Define an interface in the package that uses it, when a second implementation or a test needs one.
- Return `error` and check it at the call. Add context with `fmt.Errorf("...: %w", err)` only when the message tells the reader something new.
- Use the standard library: `net/http`, `encoding/json`, `sort`, `slices`, `strings`, `context`.
- Make the zero value useful, so a struct needs no constructor.
- Write a `for` loop for iteration; use channels and goroutines only for work that really runs concurrently.
- Run `gofmt` and follow the project's linter and test style.

## Do not (what agents over-build here)

- An interface declared before a second implementation exists. Instead: the concrete type.
- A package for one type, or packages named `util`, `common` or `helpers`. Instead: put the code in the package that uses it.
- Goroutines and channels where a loop does the job. Instead: a loop.
- Error wrapping at every layer when no layer adds information. Instead: return the error.
- A `NewThing` constructor for a struct whose zero value works. Instead: the struct literal.
- Generics for one concrete type. Instead: the concrete type.
- Package-level state set in `init()`. Instead: pass values explicitly.

## Check before finishing

- Is there an interface here with only one implementation and no test that needs it?
- Does every wrapped error add something a reader needs?
- Could a loop replace the goroutines or channels I added?
- Does the code follow the project's package layout and naming?
