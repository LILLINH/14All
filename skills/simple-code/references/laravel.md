Status: draft, not measured.

# Laravel

## Simple here looks like

A route, a controller method, Eloquent, and a view or a resource. A Form Request for long validation, a policy for authorisation, and the framework's helpers used the way the project uses them. Read `php.md` first.

## Do

- Query with Eloquent in the controller for a simple read or write.
- Use a Form Request when validation is long, and `$request->validate()` when it is short.
- Use resource controllers, route model binding and policies instead of hand-written lookups and checks.
- Use queued jobs for slow or external work only.
- Move code to a model method, a scope or an action class on its second real use.

## Do not (what agents over-build here)

- A repository over Eloquent. Instead: Eloquent, with a scope for a repeated query.
- A service class for each controller action. Instead: the work in the action.
- Events and listeners for what a method call does. Instead: call the method.
- A custom facade. Instead: inject or import the class.
- A DTO class for a request when `validated()` returns the data. Instead: use the validated array.
- A wrapper around `Collection`. Instead: the collection methods.

## Check before finishing

- Is there a layer between the controller and Eloquent that adds nothing?
- Did I add an event, service, facade or DTO with only one user?
- Does a scope or a Form Request replace code I wrote by hand?
- Does the new code follow the project's folder layout and naming?
