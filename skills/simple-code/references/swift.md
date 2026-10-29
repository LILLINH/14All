Status: draft, not measured.

# Swift

## Simple here looks like

Structs and plain functions, enums with associated values, optionals handled with `guard` and early return, `async`/`await` for asynchronous work, and the framework's own types. A SwiftUI view reads like the screen it draws.

## Do

- Use a `struct` before a `class`; use a class when identity or shared mutable state matters.
- Use `guard let` and early return for the unusual case.
- Use `let` unless the value changes.
- Use `async`/`await` for asynchronous work, in the way the project does.
- Use `extension` to group code only when it reads naturally with the type.
- Follow the project's SwiftLint settings and naming.

## Do not (what agents over-build here)

- A protocol with one conforming type. Instead: the concrete type.
- Property wrappers and result builders written for one use. Instead: plain properties and code.
- A `Manager` or `Shared` singleton class for what a function does. Instead: a function or a value passed in.
- Combine pipelines where `async`/`await` reads better. Instead: `async`/`await`.
- Force unwraps with `!`. Instead: `guard let`, `if let` or `??`.
- A view model, protocol and coordinator for a simple screen. Instead: state in the view.

## Check before finishing

- Is there a protocol, wrapper or singleton with only one user?
- Did I use `!` where `guard let` would do?
- Could `async`/`await` replace a Combine pipeline I added?
- Does the code follow the project's SwiftLint settings and naming?
