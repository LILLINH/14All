Status: draft, not measured.

# Python

## Simple here looks like

Functions and plain data (lists, dicts, dataclasses), the standard library before any package, flat code that reads top to bottom, and explicit names instead of magic. A reader needs no knowledge of a framework of your own making.

## Do

- Write a function before a class. A class is for state and behaviour that belong together.
- Use a `dataclass` for a plain record, a dict for loose data that is only passed along.
- Reach for the standard library first: `pathlib`, `collections`, `itertools`, `json`, `datetime`, `argparse`, `logging`.
- Use `with` for files, locks and connections.
- Use a comprehension for a simple transform. Write a loop once it needs more than one condition or a side effect.
- Catch the specific exception you can handle, at the place you can handle it.
- Follow the project's formatter and type-hint habit (ruff, black, mypy settings).

## Do not (what agents over-build here)

- A class named `Manager`, `Service` or `Helper` that holds no state. Instead: functions in a module.
- Abstract base classes or protocols for one implementation. Instead: the concrete class or function.
- Metaclasses, descriptors or decorators written for one use. Instead: a plain function call.
- A package for what the standard library does. Instead: the standard library, unless the project already depends on the package.
- `except Exception: pass`, or a `try/except` that only logs and re-raises. Instead: let the error propagate.
- Nested comprehensions or chained lambdas. Instead: a loop with a named variable.
- Getters and setters, or `@property`, on a plain attribute. Instead: the attribute.

## Check before finishing

- Could a function or a dict replace this class?
- Does the standard library already cover what I wrote or imported?
- Is every `except` narrow, and does it do something useful?
- Can I read each function once and say what it does in a sentence?
