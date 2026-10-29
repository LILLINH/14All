Status: draft, not measured.

# Node.js with Express

## Simple here looks like

Routes that point at small handlers: validate the input, do the work, send the response. Shared middleware only for what every route needs (parsing, authentication, error handling). The data call sits in the handler, or in one function used by two handlers. Read `javascript.md` first, and `typescript.md` when the project uses TypeScript.

## Do

- Keep a handler to three moves: read and check the input, do the work, respond.
- Use one error-handling middleware for errors, and let handlers pass errors to it, in the way the project's Express version supports.
- Parse bodies with the built-in `express.json()` and `express.urlencoded()`.
- Return the right status code and a short, consistent error body, as the project's other routes do.
- Move code out of a handler into a function when a second handler needs it.

## Do not (what agents over-build here)

- Controller, service and repository layers for a handler of a few lines. Instead: the work in the handler.
- A custom error class hierarchy for one status code. Instead: set the status and message where the error happens.
- A dependency-injection container or a registry of services. Instead: import the function you need.
- A wrapper around `app.get` or `app.post`. Instead: call them as they are.
- Middleware for logic that belongs to one route. Instead: a call at the top of that handler.
- A `try/catch` in every handler that formats its own 500 when a central error handler exists. Instead: let it reach the central handler.

## Check before finishing

- Is each handler readable top to bottom in under a minute?
- Did I add a layer, class or container that serves only one route?
- Do errors reach the project's central error handler?
- Do the status codes and error bodies match the project's other routes?
