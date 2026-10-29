Status: draft, not measured.

# Java

## Simple here looks like

Classes that hold data and the behaviour on it, records for plain data, composition instead of inheritance, constructor arguments for dependencies, and the standard library. A method is short enough to read without scrolling.

## Do

- Use a `record` for immutable data when the project's Java version has records.
- Pass dependencies through the constructor.
- Return early for the unusual case. Keep a method to one job.
- Use `List.of`, `Map.of`, enhanced `for` loops and the standard collections.
- Use a stream for a short, flat pipeline; write a loop when it grows.
- Use `Optional` as a return type for a value that may be missing, and nowhere else.
- Follow the project's formatter, naming and package layout.

## Do not (what agents over-build here)

- An interface and an `Impl` class for one implementation. Instead: the class.
- Builders and factories for an object a constructor or a record creates. Instead: the constructor.
- A class hierarchy where composition or a record is shorter. Instead: composition.
- Getters and setters on data that is not hidden. Instead: a record, or the project's own habit for plain data.
- A named design pattern (visitor, strategy, command) for two cases. Instead: an `if` or a `switch`.
- Long stream chains with nested lambdas. Instead: a loop with named steps.
- A `Utils` class of static methods for one caller. Instead: a method in the class that uses it.

## Check before finishing

- Is there an interface, builder or factory with only one user?
- Could a record or a plain constructor replace this class?
- Can I read each method without scrolling and say what it does?
- Does the code follow the project's naming and package layout?
