Status: draft, not measured.

# SQL

## Simple here looks like

One readable query per question: explicit columns, joins that follow the foreign keys, a `WHERE` that says what is wanted, and a small number of named steps when the question has stages. Parameters are bound, never pasted into the text.

## Do

- Name the columns you need. Qualify them with a table alias when a query has more than one table.
- Use `JOIN ... ON` for related tables and a CTE (`WITH`) to name a stage that would otherwise be a nested subquery.
- Pass values as bound parameters through the project's database library.
- Add `ORDER BY` whenever the result order matters, and `LIMIT` when you want a few rows.
- Check the plan (`EXPLAIN`) before adding an index, and add one only for a query that is slow.
- Follow the project's naming for tables and columns and its migration tool.

## Do not (what agents over-build here)

- Subqueries nested several levels deep. Instead: a join or a CTE with a name.
- SQL built by joining strings with user values. Instead: bound parameters.
- A view or a stored procedure for one query. Instead: the query in the application, until a second place needs it.
- Indexes and denormalised columns added before a query is slow. Instead: measure first.
- `SELECT *` in application queries. Instead: the columns the code uses.
- A transaction around a single statement, or a loop that runs one query per row. Instead: one statement over the set.

## Check before finishing

- Are all values passed as parameters rather than built into the text?
- Could a join or a named CTE replace the nested subquery?
- Does the query list the columns it needs?
- Did I add an index, view or procedure that no measured problem asks for?
