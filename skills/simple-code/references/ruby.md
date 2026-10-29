Status: draft, not measured.

# Ruby

## Simple here looks like

Small methods on plain objects, blocks and `Enumerable` for collections, guard clauses at the top, and names that read like the sentence they replace. Ruby allows a lot of cleverness; the simple version uses very little of it.

## Do

- Write short methods with one job. Return early for the unusual case.
- Use `Enumerable` (`map`, `select`, `sum`, `each_with_object`) for collections.
- Use a `Struct` or a `Data` class for a plain record, and keyword arguments when a method takes several values.
- Raise and rescue specific exceptions where you can handle them.
- Follow the project's RuboCop settings and its naming and file layout.

## Do not (what agents over-build here)

- Metaprogramming (`define_method`, `method_missing`, `send`) for what a normal method does. Instead: write the methods.
- A service object with a single `call` method for each small action. Instead: a method on the object that owns the data.
- Monkey patches to core classes. Instead: a method or a small module of your own.
- A DSL for one caller. Instead: plain method calls.
- Modules mixed in only to move code out of a long class. Instead: a smaller class, or leave the code where it is.
- `rescue => e` with no handling. Instead: let the error propagate.

## Check before finishing

- Is there metaprogramming here that an ordinary method would replace?
- Did I add a service object, mixin or DSL with only one user?
- Does each method do one thing that I can name?
- Does the code follow the project's RuboCop settings?
