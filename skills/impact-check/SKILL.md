---
name: impact-check
description: Use when about to change a function, a type, a configuration key, a file name, a database column or any interface other code may use, before you edit it.
---

# Impact Check

Find out who depends on a thing before you change it, not after a test or a user tells you.

## Before you edit

1. **Name what will change:** the symbols, files, keys, columns or routes, and whether the change alters behaviour, a signature, a name or a stored format.
2. **Find who uses each one.** Search the repository for the whole word, then for the file's imports. Look at tests, documentation, configuration, scripts and CI. Use the repository as it is now: never rely on a summary or a map made earlier in the session.
3. **Look for the uses a search misses:** a name built from a string, a route or event name, an environment variable, a column name inside SQL or a template, a generated file, code in another repository that the package exports to. You cannot see some of these. Say so, do not skip them.
4. **Go one step further out** (the users of the users) only when the change alters behaviour or a signature. A rename needs only the first step.
5. **Sort what you found** into four groups:
   - **Changed:** what you will edit.
   - **Affected:** direct users that must change or be re-checked.
   - **Looked at, not affected:** users you read and found unaffected, with the reason in a few words.
   - **Cannot determine:** dynamic, generated or outside the repository.
6. **State the risk:** high for an exported interface, a stored data format or a migration, or when many files are affected; and which tests cover the users you found.
7. Report this before you edit, in a few lines in your reply, so the user can stop you. Wait for the user's answer only when the risk is high or the "Cannot determine" group is not empty; otherwise go on.

## After you edit

Search again for the old name, key or signature. Any user left behind is a finding: fix it or report it. Run the tests that cover the affected users, and read the result.

## Label what you know

For each user say how you know: `read` (found by the search and opened), `inferred` (reasoned, not opened) or `unverified`.

## Not for

Writing the new code (see `simple-code` and `test-driven-development`) or reviewing a finished change (see `code-review`). This skill decides whether the change is safe to start, and that nothing was left behind when it ends.
