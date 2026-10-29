Status: draft, not measured.

# ASP.NET Core

## Simple here looks like

A minimal API endpoint or a controller action that calls the `DbContext` or one service directly, with the built-in dependency injection, configuration, validation and middleware. Read `csharp.md` first.

## Do

- Use minimal APIs or controllers, whichever the project uses.
- Inject the `DbContext` or a service through the constructor.
- Validate with `[ApiController]` and data annotations, and return `ProblemDetails` for errors.
- Read settings with `appsettings.json` and the options pattern.
- Use the built-in middleware (authentication, CORS, exception handling) before writing your own.
- Map a few fields by hand in an endpoint when that is shorter than a mapping library.

## Do not (what agents over-build here)

- A controller, service, repository and mapper chain for a simple query. Instead: query in the action, or one service.
- Custom middleware for one route. Instead: an endpoint filter, an attribute, or a check in the action.
- A registered service for what a static function does. Instead: the function.
- A mapping library for a handful of fields. Instead: assign the fields.
- CQRS and a mediator for CRUD. Instead: the action and the `DbContext`.
- A base controller hierarchy. Instead: separate small controllers or endpoints.

## Check before finishing

- Is there a layer between the endpoint and the data that adds nothing?
- Did I add middleware, a service or a mapper with only one user?
- Do errors return `ProblemDetails` the way the project's other endpoints do?
- Does the code follow the project's folder layout and naming?
