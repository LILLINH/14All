Status: draft, not measured.

# FastAPI

## Simple here looks like

One function per route, typed parameters, a Pydantic model for the body and the response, and `Depends` only for what several routes really share, such as the database session and the current user. Read `python.md` first.

## Do

- Write the route as one function: take the input, do the work, return the model.
- Use a Pydantic model for a request body and for the response.
- Use `Depends` for the database session and authentication in the way the project's other routes do.
- Declare `async def` only when the body awaits something asynchronous.
- Raise `HTTPException` with the right status code and a short message.
- Move code out of a route into a function when a second route needs it.

## Do not (what agents over-build here)

- A repository and a service class for every route. Instead: the work in the route, or one function used by two routes.
- A chain of dependencies that returns a constant. Instead: import the constant.
- A separate schema class for every field combination that differs by one field. Instead: one model, or a small base model with one subclass.
- `BackgroundTasks` for work the request can finish quickly. Instead: do it in the request.
- Routers wrapped in classes, or an exception hierarchy for one error. Instead: plain routers and `HTTPException`.

## Check before finishing

- Is each route readable top to bottom without opening other files?
- Did I add a layer, class or dependency with only one user?
- Is each `async def` awaiting something?
- Do the status codes and error bodies match the project's other routes?
