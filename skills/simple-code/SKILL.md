---
name: simple-code
description: "Use when about to write or change code in a project. Learns how the project already writes code (its written rules first, then its habits), follows them for style, and keeps the new code simple enough for a person to read and maintain, with per-language and per-framework guidance for when the project gives no answer."
---

# Simple Code

Write the code an experienced senior developer would write: plain enough that a person can read it and maintain it. Match the project you are in; do not copy its needless complexity.

## The routine

0. **Scale the effort to the change.** The full routine is for new code or a real change. For a one-line fix, a configuration tweak, or an edit to a generated, vendored or lock file, skip it: look at the file you are editing and match it. Generated and vendored code is never a source of conventions.
1. **Find what you are in.** From the files you are about to touch, work out the language and framework (file extensions, `package.json` dependencies, `pyproject.toml`, `go.mod`, `pom.xml`, `composer.json`, and the like). Read only the matching entries under References. In a monorepo or a project in several languages, choose by the files you touch, not by the repository as a whole.
2. **Learn the project's conventions before writing.** Read in this order, and stop when the picture is clear: formatter and linter configuration (`.editorconfig`, ESLint, Prettier, ruff, golangci-lint, and similar); the project's written rules (`CONTRIBUTING`, `CLAUDE.md`, `AGENTS.md`, style docs); two or three files closest to what you will write, plus one test file. Never read generated, vendored or lock files for this. Note for yourself, in a few lines: naming, file and folder layout, formatting, the style of error handling and of tests, how much is commented. Keep two kinds of finding apart: **written rules** (anything the project states in its rule files, style docs or lint configuration) and **habits** (what the code happens to do).
3. **Follow written rules; follow habits only for style, not for complexity.**
   - A written rule wins, even when it asks for structure the rules below would avoid (a repository layer, a service per endpoint, a state library). It is the team's or the user's instruction. If it makes a small job heavier, do what it says and add one sentence to your final report naming the rule. A direct request from the user beats a written rule.
   - A habit is followed for style: naming, layout, formatting, how errors and tests are written. It is not followed for structure. Layers, wrappers, patterns and indirection that exist only because older code has them are not copied.
   - When existing code is more complicated than the job needs and no written rule asks for it, write the new code the simple way, leave the old code alone, and say so in one sentence in your final report.
   - If there is no linter, no configuration, no written rules and no similar file to learn from, the project gives no answer: use the defaults in the matching reference.
4. **Write the simple version first.** Apply the rules below.
5. **Check before saying done.** Could this be shorter without losing meaning? Is every new name, file, parameter and dependency needed by the task as asked? Would a new teammate follow it on first read?
6. **Offer, do not write.** If the conventions were not written down anywhere, offer a short summary the user can save in their project's rule file. Do not save it unasked.

## Rules

- Use the plain thing: a function before a class, the language or platform feature before a dependency, a direct call before indirection.
- No abstraction until a second real use exists. Three similar lines are better than a helper made for one.
- Names say what a thing is; comments say why, not what.
- Keep control flow flat: early returns over deep nesting, one level of abstraction per function.
- No speculative options, flags, configuration or extension points. Do not handle errors that cannot happen.
- Smallest diff that does the job. Delete before adding. No unrelated cleanup.
- Precedence: a written project rule beats these rules. Where there is no written rule, a habit of the project beats them on style, and these rules beat the habit on structure.

## References

Read only the entries that match the files you are about to touch. A framework entry assumes its language entry is read too. If a language has no reference, use the language-agnostic rules above and say so in your report.
