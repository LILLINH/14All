Status: draft, not measured.

# Rails

## Simple here looks like

RESTful controllers with small actions, models that carry validations, associations and scopes, and views with partials. Rails conventions do most of the work. Read `ruby.md` first.

## Do

- Keep controller actions short: load, authorise, act, render or redirect. Use `before_action` for loading and authorisation.
- Put validations, associations and scopes on the model.
- Use strong parameters, resourceful routes and the generators' file layout.
- Use `has_many :through`, `includes` and `joins` rather than hand-written loops over queries.
- Use background jobs for slow or external work only.

## Do not (what agents over-build here)

- A service object or a form object for plain create, update and delete. Instead: the action and the model.
- A concern created only to move code out of sight. Instead: leave it in the model, or extract a real concept.
- Callbacks such as `after_save` that run business steps across models. Instead: an explicit call in the action or a model method.
- A repository or query object over Active Record for one query. Instead: a scope.
- `default_scope`, which changes every query silently. Instead: a named scope.

## Check before finishing

- Is the controller action short enough to read at a glance?
- Did I add a service, form object, concern or callback with only one user?
- Would a scope or a model method replace any query object I added?
- Does the new code follow the project's directory layout and naming?
