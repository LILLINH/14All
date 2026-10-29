# Simple code across languages and frameworks: Design

Date: 2026-10-29. Status: draft, waiting for the owner's approval. Written after a conversation with the owner; what the owner said is marked "owner", and every choice that is mine is marked "my call".

## Intent

AI coding agents write code that is longer and more tangled than the job needs: extra layers, helpers used once, options nobody asked for, patterns applied because they exist. The owner wants the code an experienced senior developer would write: plain enough that a person can read it and maintain it, not code that only a machine finds easy to follow.

14All gets one new skill that makes the agent (1) learn how the project it is in already writes code and follow those habits, and (2) keep the code it adds simple, with per-language and per-framework guidance for the cases where the project gives no answer.

Why now: the owner sees the problem in daily work with Vue and React, and wants the same behaviour for every language, not only those two.

## Goals

1. Code the agent adds to an existing project looks like it belongs there: names, layout, formatting, error handling and test style match the project (owner).
2. The new code is simpler than the agent would write by default, even when the surrounding code is not simple (owner: "keep new code simple").
3. The skill works for a wide range of languages and frameworks at once, not one at a time (owner chose breadth over depth first).
4. In a new or empty project, per-language defaults say what simple code looks like in that language and framework.
5. The guidance costs no tokens when it does not apply: only the references for the languages in use are read.

## Non-goals

- No hook, linter, formatter or other enforcement. The skill guides the agent; it does not block anything.
- The agent does not refactor existing code unless asked (my call, owner not asked directly).
- The skill does not write or edit the project's `CLAUDE.md`, `AGENTS.md` or other instruction files on its own (my call). It may offer a short summary of the conventions it found; the user decides whether to save it.
- No bundled style guide for any language. The references say how to keep code simple, not how to format it; formatting belongs to the project's own tools.
- No claim that the skill works, until it has been measured (see Evaluation).

## Anti-goals (a failure even if it technically works)

- Generic advice such as "write clean code" or "keep it simple" with no concrete test. The agent reads it and writes the same code as before.
- Copying the project's complexity because "that is how the project does it". Conventions are copied; needless layers are not.
- The reverse: ignoring the project's naming, layout or test style because the agent prefers its own.
- A second skill that fires on the same trigger and gives different advice. This is why there is one skill, not two (my call).
- Reference files that are long enough to cost real context on every coding task.
- Rules presented as verified for a language nobody tried them on.

## What the owner decided

- The rules are per language and per framework, and a project's own rules take priority: the agent learns them and follows them (owner).
- When old code in the project is itself convoluted, new code stays simple (owner).
- Cover many languages in one pass, at moderate depth each, not Vue and React first (owner).
- The owner works with JavaScript frameworks, Vue and React, so these two get the same care as any other entry (owner).

## Design

### One skill: `simple-code`

`skills/simple-code/SKILL.md` (class `original`, maturity `draft`, written fresh, no upstream source) with `references/<name>.md` files. Its description fires when the agent is about to write or change code, and it is the only skill that does.

The steps in `SKILL.md`:

0. **Scale the effort to the change.** The full routine below is for writing new code or a real change. For a one-line fix, a configuration tweak, or an edit to generated, vendored or lock files, skip it: look at the file you are editing and match it. Generated and vendored code is never a source of conventions.
1. **Find what you are in.** From the files you are about to touch, work out the language and framework (file extensions, `package.json` dependencies, `pyproject.toml`, `go.mod`, `pom.xml`, `composer.json`, and the like). Read only the matching references.
2. **Learn the project's conventions before writing.** Read, in this order and stopping when the picture is clear: formatter and linter configuration (`.editorconfig`, ESLint, Prettier, ruff, golangci-lint, and similar); the project's written rules (`CONTRIBUTING`, `CLAUDE.md`, `AGENTS.md`, style docs); two or three files closest to what you will write, plus one test file. Note, in a few lines for yourself: naming, file and folder layout, formatting, the style of error handling and of tests, how much is commented. Keep two kinds of finding apart: **written rules** (anything the project states in `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING`, style docs or lint configuration) and **habits** (what the code happens to do).
3. **Follow written rules; follow habits only for style, not for complexity.**
   - A **written rule** wins, even when it asks for structure the simple rules below would avoid (a repository layer, a service per endpoint, a state library). It is the team's or the user's instruction, and instructions beat skills. If such a rule makes a small job heavier, do what it says and add one sentence to the final report naming the rule.
   - A **habit** is followed for style: naming, layout, formatting, how errors and tests are written. It is not followed for structure. Layers, wrappers, patterns and indirection that exist only because older code has them are not copied.
   - When existing code is more complicated than the job needs and no written rule asks for it, write the new code the simple way, leave the old code alone, and say so in one sentence in the final report.
4. **Write the simple version first.** The rules below, applied in this order of priority.
5. **Check before saying done.** A short checklist: could this be shorter without losing meaning, is every new name, file, parameter and dependency needed by the task as asked, would a new teammate follow it on first read.
6. **Offer, do not write.** If the conventions were not written down anywhere, offer a short summary the user can save. Do not save it unasked.

The language-agnostic rules (my call, written fresh, in `SKILL.md`):

- Use the plain thing: a function before a class, the language or platform feature before a dependency, direct calls before indirection.
- No abstraction until a second real use exists. Three similar lines are better than a helper made for one.
- Names say what a thing is; comments say why, not what.
- Flat control flow: early returns over deep nesting; one level of abstraction per function.
- No speculative options, flags, configuration or extension points. Do not handle errors that cannot happen.
- Smallest diff that does the job. Delete before adding. No unrelated cleanup.
- Precedence: a written project rule beats these rules. Where there is no written rule, a habit of the project beats them on style (naming, layout, formatting, how errors and tests are written) and these rules beat the habit on structure (layers, patterns, indirection).

### References

One file per entry, `skills/simple-code/references/<name>.md`, at most about 80 lines each. Every file has the same four parts, so the agent reads them the same way:

1. **Simple here looks like**: the shape of plain code in this language or framework.
2. **Do**: concrete habits.
3. **Do not (what agents over-build here)**: the usual excess, with the plain alternative.
4. **Check before finishing**: three to five yes/no questions.

`SKILL.md` carries an index of the reference files with one line on when to read each. A consistency test checks that every listed file exists and every reference file is listed.

Entries for the first pass (my call; the owner gave only Vue and React and "all languages"):

- **Languages:** JavaScript, TypeScript, Python, Go, Java, Kotlin, C#, PHP, Ruby, Rust, Swift, C and C++, SQL, shell.
- **Frameworks:** React, Vue, Next.js, Nuxt, Node.js with Express, Django, FastAPI, Spring Boot, Laravel, Rails, ASP.NET Core.

A framework reference assumes its language reference is read too, and only adds what is specific to the framework. React and Vue are written with the care the owner's daily work needs: the usual excess there (custom hooks and composables for one use, state libraries for local state, prop drilling replaced by context too early, wrapper components with no behaviour) is named explicitly.

Languages the list leaves out get the language-agnostic rules only, and the skill says so.

Every reference file starts with the line `Status: draft, not measured.` until an evaluation run supports it. A test checks the line is present, so no reference looks verified before it is.

### Bootstrap

`using-14all` gets one line in "Skill Priority": writing or changing code in a project uses `simple-code`. The bootstrap stays under its token budget (2.5k tokens; it is about 670 estimated tokens now).

### Interaction with other skills

`test-driven-development` says when to write the test; `simple-code` says what the code looks like. They do not contradict. `simple-code` does not duplicate the TDD process. The user's own instructions (`CLAUDE.md`, direct requests) still beat the skill, as they beat every skill in `using-14all`.

## Scope of this build

All of it (my call): the skill with its language-agnostic rules and index, every reference in the first-pass list, and the evaluation tasks for React and Vue with their fixtures and deterministic checks. The README gains a short note that the skill is unmeasured until a run exists. Running the evaluation against a model is a separate step the owner starts; building it is in scope.

## Constraints

- The lint rules for skills apply: `SKILL.md` at most 400 lines, name equal to the directory, only `name` and `description` in the frontmatter, description at most 1024 characters, a valid `meta.yaml`.
- `class: original`, `sources: []`, `maturity: draft`, `adapters_tested: []`. Nothing is copied from an upstream repository; no notice entry is needed. If any reference text is adapted from an outside source later, it needs a pinned source and a notice entry.
- References are read on demand, never injected at session start.
- The guidance describes actions, not tool names, like the other skills.
- Only Claude Code is verified in this repository; the skill claims nothing else.

## Evaluation

No benchmark numbers exist and none are claimed. To measure it (my call): one task per stack for React and Vue, in the existing harness. Each fixture is a small project whose existing code is deliberately over-built, plus a small feature request. Deterministic checks only, as in E1 to E4: no new dependency, no file beyond what the task needs, new identifiers follow the project's naming, new code stays under a line threshold. Whether the code reads as simple needs a maintainer's rubric score, which is not automated. Until a run exists, the README says the skill is unmeasured.

Delivery order (my call): the skill, the language-agnostic rules and the index first; then the references; then the evaluation tasks. The skill ships as `draft`.

## Left to the builder

- The exact wording and examples inside each reference, within the four-part shape.
- The order of the reference index.
- The thresholds in the evaluation checks.
- Whether the consistency test also checks the length of each reference.

## My calls the owner has not confirmed

- One skill with references, not several skills.
- A written project rule beats the skill; only habits seen in code are overridden on structure.
- The effort scales with the change: the full routine is skipped for one-line fixes, configuration tweaks and generated or vendored files.
- Every reference carries `Status: draft, not measured.`, checked by a test.
- The build covers the skill, all references and the React and Vue evaluation tasks; running the evaluation is a separate step.
- Which languages and frameworks are in the first pass.
- The agent does not refactor old code, and does not write the project's instruction files unasked.
- Reporting in one sentence when it chose not to follow existing complexity.
- The evaluation design.
