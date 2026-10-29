Status: draft, not measured.

# Rust

## Simple here looks like

Structs, enums and functions, owned values, `Result` and the `?` operator, iterators for short pipelines, and the standard library. The borrow checker is satisfied by simple data flow, not by tricks.

## Do

- Own values and clone where it keeps the code simple. Optimise after measuring.
- Return `Result` and use `?`. Use the project's error crate (`thiserror`, `anyhow`) the way it does.
- Use `match` and `if let` for enums and `Option`.
- Use an iterator chain for a short transform and a `for` loop when it needs more.
- Derive the standard traits (`Debug`, `Clone`, `PartialEq`) instead of writing them.
- Follow `rustfmt` and the project's Clippy settings.

## Do not (what agents over-build here)

- A trait for one implementation. Instead: the concrete type or function.
- Explicit lifetimes and generics where owned values work. Instead: owned values.
- A `macro_rules!` macro for what a function does. Instead: the function.
- `Rc<RefCell<_>>` or `unsafe` to get around the borrow checker. Instead: change how the data is shared.
- A builder type for a plain struct. Instead: a struct literal, with `..Default::default()` when needed.
- `unwrap()` and `expect()` in non-test code. Instead: `?`, or handle the case.

## Check before finishing

- Is there a trait, lifetime or generic here that owned concrete values would replace?
- Did I use `Rc<RefCell<_>>`, `unsafe` or `unwrap()` to avoid a design change?
- Could a loop replace an iterator chain that is hard to read?
- Does the code pass `rustfmt` and Clippy as the project runs them?
