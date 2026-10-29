Status: draft, not measured.

# Kotlin

## Simple here looks like

Data classes and plain functions, `val` by default, null safety used directly, `when` for a few branches, and the standard collection functions. It reads like short prose, not like a language demonstration.

## Do

- Use a `data class` for plain data and top-level functions for behaviour that needs no object.
- Use `val`; use `var` only when the value changes.
- Use `?.`, `?:` and `let` for nullable values, in the plainest form that reads well.
- Use `map`, `filter` and `firstOrNull` for simple collection work.
- Use default arguments instead of several overloads.
- Use coroutines only where the project is already asynchronous.

## Do not (what agents over-build here)

- Extension functions or a builder DSL written for one use. Instead: a normal function.
- A sealed hierarchy for two cases that carry no data. Instead: an enum, a boolean or a nullable value. Keep the hierarchy when the cases carry different data, such as a result type.
- Coroutines or flows where a plain function does the job. Instead: the plain function.
- Scope functions nested inside each other so the flow is hard to follow. Instead: named local values.
- An `object` singleton that holds mutable state. Instead: pass the value in.
- `lateinit` and `!!` used to avoid a design decision. Instead: a nullable type, or construct the value in time.

## Check before finishing

- Is there an extension function, DSL or sealed type with only one user?
- Could a plain function replace the coroutine or flow I added?
- Are scope functions nested more than one level?
- Does the code follow the project's naming and file layout?
