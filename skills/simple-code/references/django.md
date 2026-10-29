Status: draft, not measured.

# Django

## Simple here looks like

Models that hold data and the queries on it, views that fetch and render, forms or serializers that validate. The ORM is called directly where a simple query is needed. Read `python.md` first.

## Do

- Query with the ORM in the view or in a method on the model: `filter`, `select_related`, `prefetch_related`.
- Use the style of view the project uses (function views or generic class-based views) and the generic views it already uses.
- Use `ModelForm` or the project's serializer for validation instead of checking fields by hand.
- Move a query to a model method or a custom queryset on its second real use.
- Use Django's own pieces: authentication, admin, messages, the `urls.py` layout, migrations from `makemigrations`.

## Do not (what agents over-build here)

- A service layer or repository between a view and the ORM for a simple query. Instead: the query in the view.
- A custom manager for one query. Instead: the queryset call where it is used.
- Signals for what a method call does. Instead: call the method.
- A class-based view with several mixins where a function view is shorter. Instead: the function view.
- An overridden `save()` that hides business steps. Instead: an explicit call in the view or a model method.
- Settings wrapped in a configuration class. Instead: plain settings.

## Check before finishing

- Is there a layer between the view and the ORM that adds nothing?
- Did I add a manager, signal or mixin with only one user?
- Does validation use the project's form or serializer?
- Does the new code follow the project's view style?
