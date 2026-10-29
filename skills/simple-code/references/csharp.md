Status: draft, not measured.

# C#

## Simple here looks like

Classes and records with a few methods, `async`/`await` for input and output, LINQ for simple queries, pattern matching and switch expressions where they are shorter, and constructor injection with the built-in container.

## Do

- Use a `record` for immutable data.
- Use `var` where the type is obvious from the right-hand side, in the way the project does.
- Use a switch expression or pattern matching where it replaces a chain of `if` statements.
- Use `async`/`await` only for real input and output, and await the result.
- Use LINQ for a short query and a loop when it gets complicated.
- Follow the project's nullable-reference-type setting, formatter and naming.

## Do not (what agents over-build here)

- An interface for each class when only one class implements it. Instead: the class. Keep it where the project's tests mock through interfaces.
- A generic repository over the ORM. Instead: use the `DbContext` directly; it already is a repository.
- A mediator and a handler class for a direct call. Instead: the call.
- Extension methods and partial classes used to hide code. Instead: a method in the class that owns it.
- A static helper class for one caller. Instead: a method on the class that uses it.
- An abstract base class for two classes. Instead: composition or a shared method.
- A `catch` that swallows the exception. Instead: let it propagate.

## Check before finishing

- Is there an interface, repository or handler with only one user?
- Could a method on the existing class replace the helper or extension I added?
- Is every `async` method awaiting real input or output?
- Does the code follow the project's naming and nullable settings?
