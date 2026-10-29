Status: draft, not measured.

# PHP

## Simple here looks like

Small functions and classes with typed parameters and return types, the native array functions, and one class with one purpose. Follow the project's standard (usually PSR-12) and its `declare(strict_types=1)` habit.

## Do

- Type parameters and return values the way the project does.
- Use constructor promotion, named arguments, `match` and the null-safe operator `?->` where they shorten the code.
- Use the native array functions (`array_map`, `array_filter`, `array_column`) for simple transforms.
- Use a small class or a typed value for data with a fixed shape.
- Handle the exceptions you can handle, at the place you can handle them.

## Do not (what agents over-build here)

- An interface with one implementation. Instead: the class.
- A factory that only calls `new`. Instead: `new`.
- A static `Util` or `Helper` class for one caller. Instead: a method on the class that uses it.
- Arrays of arrays passed through several functions. Instead: a small class or a typed value.
- A hierarchy of abstract classes, or a service locator. Instead: composition and plain constructor arguments.
- Getters and setters on data that is not hidden. Instead: public readonly properties, if the project uses PHP 8.1 or later.

## Check before finishing

- Is there an interface, factory or abstract class with one user?
- Does a small class replace any array of arrays I passed around?
- Are types written the way the project writes them?
- Does the code follow the project's coding standard?
