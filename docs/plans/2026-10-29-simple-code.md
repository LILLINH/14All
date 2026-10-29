# Simple Code Implementation Plan

> **Historical record.** This plan was used to build the repository. Its checkboxes were not ticked as work went on, so they do not show progress. What shipped is listed in `CHANGELOG.md`.

**Goal:** Add one skill, `simple-code`, with 25 per-language and per-framework references, that makes the agent learn a project's conventions and keep the code it adds simple, plus React and Vue evaluation tasks.

**Architecture:** `skills/simple-code/SKILL.md` holds the routine, the language-agnostic rules and an index; `skills/simple-code/references/<name>.md` hold the per-language and per-framework guidance, read on demand. Tests check the skill's content, the references' shape and index consistency. Two evaluation tasks (E13 React, E14 Vue) reuse the existing harness with a shared deterministic grader.

**Tech Stack:** Markdown, Node 22 `node:test` (no new dependencies), the existing lint (`scripts/lib/lint.mjs`) and eval harness (`evals/`).

**Spec:** `docs/specs/2026-10-29-language-rules-design.md`

## Global Constraints

- `SKILL.md` at most 400 lines; name equals the directory name (`simple-code`); only `name` and `description` in the frontmatter; description at most 1024 characters and no unquoted ` #`.
- `meta.yaml`: `class: original`, `sources: []`, `changed: {made: false, summary: ""}`, `maturity: draft`, `adapters_tested: []`, `owner: LILLINH`, `last_reviewed: 2026-10-29`. Nothing is copied from an upstream repository, so no `THIRD_PARTY_NOTICES.md` entry.
- References are read on demand and never injected at session start.
- Each reference is at most about 80 lines (the test allows 90), starts with the line `Status: draft, not measured.`, and has exactly these four sections in this order: `Simple here looks like`, `Do`, `Do not (what agents over-build here)`, `Check before finishing`.
- The bootstrap stays within its budget (the existing test proxy: at most 8000 bytes).
- The guidance describes actions, never tool names.
- Only Claude Code is verified in this repository; nothing here claims another agent.
- Repo conventions: `docs/specs/` and `docs/plans/`, conventional commit messages, `npm test` and `npm run check` green before every commit.

## Review Focus

Failure modes the spec implies but a task list would not test on its own, most likely first. Each has its test in the task named.

1. A project with no linter, no config and no written rules (new or empty): the skill must fall back to the reference defaults instead of stalling. Task 1.
2. A monorepo with several languages: references are chosen from the files being touched, not from the repository as a whole. Task 1.
3. A language not in the list: the language-agnostic rules apply and the skill says so. Task 1.
4. A written rule that conflicts with the user's direct request: the request wins. Task 1.
5. Reading cost: generated, vendored and lock files are never read for conventions, and reading stops once the picture is clear. Task 1.

---

### Task 1: The `simple-code` skill

**Files:**
- Create: `skills/simple-code/SKILL.md`, `skills/simple-code/meta.yaml`
- Create: `tests/simple-code.test.mjs`

**Interfaces:**
- Produces: the skill directory name `simple-code`; in `SKILL.md` a section headed exactly `## References` whose entries are lines of the form ``- `references/<name>.md`: <when to read it>``. Tasks 3 to 6 add entries to it; Task 2's tests parse it.

- [ ] **Step 1: Write the failing tests** in `tests/simple-code.test.mjs`, using `lintSkillDir` from `scripts/lib/lint.mjs`. Test names and assertions:
  - `the skill exists and passes lint`: `lintSkillDir('skills/simple-code')` returns `[]`.
  - `meta.yaml marks it original, draft and unmeasured`: parsed meta has `class: original`, `maturity: draft`, `sources` empty, `adapters_tested` empty.
  - `the routine has its seven steps in order`: `SKILL.md` has numbered steps 0 to 6 whose bold titles match, in order: `Scale the effort`, `Find what you are in`, `Learn the project's conventions`, `Follow written rules`, `Write the simple version first`, `Check before saying done`, `Offer, do not write`.
  - `written rules beat the skill and habits are followed for style only`: text matches `/written rule[^.]*wins/i`, `/habit[^.]*style/i` and `/not copied/i`.
  - `the language-agnostic rules are present`: text contains each of `function before a class`, `second real use`, `early return`, `Smallest diff`, and `speculative`.
  - Review Focus 1, `with nothing to learn from, it falls back to the reference defaults`: text matches `/no (linter|configuration)[^.]*(default|reference)/i`.
  - Review Focus 2, `references are chosen from the files you touch`: text matches `/files you (are about to )?touch/i` and `/monorepo|several languages/i`.
  - Review Focus 3, `a language without a reference gets the agnostic rules and the skill says so`: text matches `/no reference[^.]*(agnostic|rules above)/i`.
  - Review Focus 4, `the user's direct request beats a written rule`: text matches `/direct request/i`.
  - Review Focus 5, `generated and vendored files are not read for conventions, and reading stops early`: text matches `/generated|vendored|lock file/i` and `/stop(ping)? when/i`.
  - `it offers and does not write the conventions file`: text matches `/do not save it unasked/i`.
  - `it names no agent tools`: no match for `\b(TodoWrite|Task tool|Skill tool|Bash tool|Read tool|Edit tool|Write tool|Agent tool)\b`.

- [ ] **Step 2: Run** `node --test tests/simple-code.test.mjs`. Expected: every test FAILS (the skill does not exist).

- [ ] **Step 3: Write `skills/simple-code/SKILL.md` and `meta.yaml`.** Frontmatter `name: simple-code`, and a quoted `description` that fires when about to write or change code in a project and says what the skill does (learns the project's conventions, keeps new code simple). Body, in this order: a two-line statement of purpose; "The routine" with steps 0 to 6 as written in the spec's Design section, including the two kinds of finding (written rules, habits) and the fallback, monorepo, unlisted-language, direct-request and reading-cost rules from the Review Focus list; "Rules" with the seven language-agnostic rules and the precedence rule from the spec, worded as the spec words them; `## References` with the intro line "Read only the entries that match the files you are about to touch." and no entries yet. `meta.yaml` as in Global Constraints.

- [ ] **Step 4: Run** `node --test tests/simple-code.test.mjs` then `npm test` and `npm run check`. Expected: all PASS.

- [ ] **Step 5: Commit** `git add skills/simple-code tests/simple-code.test.mjs` with message `feat(skills): add simple-code with its routine and rules`.

### Task 2: Reference shape and index consistency tests

**Files:**
- Modify: `tests/simple-code.test.mjs`

**Interfaces:**
- Consumes: the `## References` entry format from Task 1.
- Produces: the contract every reference file in Tasks 3 to 6 must meet. Constants in the test file: `LANGUAGE_OF` mapping each framework file name (without `.md`) to its language file: `react`, `vue`, `nextjs`, `nuxt`, `nodejs-express` to `javascript`; `django`, `fastapi` to `python`; `spring-boot` to `java`; `laravel` to `php`; `rails` to `ruby`; `aspnet-core` to `csharp`.

- [ ] **Step 1: Add the tests**, which pass vacuously while no reference exists:
  - `every indexed reference exists and every reference file is indexed`: the set of names from `/^- `references\/([a-z0-9-]+)\.md`:/gm` in `SKILL.md` equals the set of `*.md` files in `skills/simple-code/references/` (the directory may not exist yet: treat as empty).
  - `every reference has the same shape`, per file: line 1 is exactly `Status: draft, not measured.`; line 3 starts with `# `; the `## ` headings are exactly the four in Global Constraints, in order; the file has at most 90 lines; the bullets under `Check before finishing` number 3 to 5 and each ends with `?`.
  - `every framework reference points at its language reference`: for each name in `LANGUAGE_OF` that has a file, the text contains `` `<language>.md` ``.
  - `no reference names an agent tool`: same regex as Task 1.
- [ ] **Step 2: Run** `node --test tests/simple-code.test.mjs`. Expected: PASS.
- [ ] **Step 3: Prove the shape test can fail:** temporarily create `skills/simple-code/references/zz-bad.md` containing one line `# Bad`; run the file again. Expected: FAIL on both the index test and the shape test. Delete the file.
- [ ] **Step 4: Commit** `git add tests/simple-code.test.mjs`, message `test(skills): check the simple-code references' shape and index`.

### Task 3: JavaScript family references (the owner's stack)

**Files:**
- Create: `skills/simple-code/references/{javascript,typescript,react,vue,nextjs,nuxt,nodejs-express}.md`
- Modify: `skills/simple-code/SKILL.md` (seven index entries), `tests/simple-code.test.mjs`

**Interfaces:**
- Consumes: the shape contract from Task 2.
- Produces: seven indexed files. Each index entry names the signal that selects it (for example "a `package.json` that lists `react`").

- [ ] **Step 1: Add the failing tests:** `react.md` matches `/custom hook/i`, `/context/i`, `/wrapper component/i` and `/state (library|management)/i`; `vue.md` matches `/composable/i`, `/wrapper component/i` and `/Pinia|state library/i`. Run them. Expected: FAIL (files missing).
- [ ] **Step 2: Write the seven references** in the four-part shape, original text, concrete enough that each "Do not" names the excess and the plain alternative. Excess each must name:
  - `javascript`: class for what a function does, a utility module for one caller, promise chains where `await` reads better, clever one-liners (nested ternaries, chained reduce), a dependency for what the platform has (`Array`, `Intl`, `fetch`).
  - `typescript`: generics and conditional types where a plain type works, `any` and casts used to silence errors, an interface per object, enums where a union of strings does, abstract classes for one implementation.
  - `react`: a custom hook for one use, context for local or near state, a state library for local state, a wrapper component with no behaviour, `useMemo` and `useCallback` with no measured need, effects that compute what can be derived while rendering.
  - `vue`: a composable for one use, a Pinia store for local state, `provide` and `inject` where props work, a wrapper component with no behaviour, watchers that compute what a computed value gives, Options API and Composition API mixed in one component.
  - `nextjs`: client components where a server component works, route handlers or server actions for what a component does, extra data layers over `fetch`, middleware for one route.
  - `nuxt`: a plugin or module for one use, a composable that wraps `useFetch` with no change, a store where `useState` is enough, server routes duplicating a page's data.
  - `nodejs-express`: layers (controller, service, repository) for a three-line handler, a custom error hierarchy for one status code, dependency injection containers, wrapper functions over `app.get`.
  Framework files begin the Do section with a pointer to read `javascript.md` (and `typescript.md` when the project uses TypeScript).
- [ ] **Step 3: Add the seven index entries** to `SKILL.md` in the form from Task 1.
- [ ] **Step 4: Run** `node --test tests/simple-code.test.mjs`, then `npm test` and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `git add skills/simple-code tests/simple-code.test.mjs`, message `feat(skills): simple-code references for JavaScript, TypeScript, React, Vue, Next.js, Nuxt, Node`.

### Task 4: Python, Ruby and PHP references

**Files:**
- Create: `skills/simple-code/references/{python,django,fastapi,ruby,rails,php,laravel}.md`
- Modify: `skills/simple-code/SKILL.md` (seven index entries)

**Interfaces:** Consumes the Task 2 contract; produces seven indexed files, framework files pointing at `python.md`, `ruby.md` or `php.md`.

- [ ] **Step 1: Write the references.** The Task 2 tests already cover their shape and the language pointers; the index test fails until Step 2 adds the entries. Excess to name:
  - `python`: a class where a function or a dict works, abstract base classes and protocols for one implementation, metaclasses and decorators for one use, a helper package for what the standard library has (`pathlib`, `dataclasses`, `itertools`), over-broad `try/except`.
  - `django`: a service layer over the ORM for simple queries, custom managers for one query, signals for what a method call does, class-based views with many mixins where a function view works.
  - `fastapi`: a repository and service layer per route, dependency injection chains for a constant, a schema class per field set that differs in one field, background tasks for what the request can do.
  - `ruby`: metaprogramming (`define_method`, `method_missing`) for what a method does, a service object per method, monkey patches, DSLs for one caller.
  - `rails`: service objects and form objects for simple CRUD, concerns used as a way to hide code, callbacks for business flow, custom abstractions over Active Record.
  - `php`: interfaces with one implementation, a factory for `new`, static helper classes for one caller, arrays of arrays where a small class or a typed value works.
  - `laravel`: repositories over Eloquent, a service per controller action, events and listeners for what a call does, custom facades.
- [ ] **Step 2: Add the seven index entries.**
- [ ] **Step 3: Run** `node --test tests/simple-code.test.mjs`, `npm test`, `npm run check`. Expected: PASS.
- [ ] **Step 4: Commit** `git add skills/simple-code`, message `feat(skills): simple-code references for Python, Django, FastAPI, Ruby, Rails, PHP, Laravel`.

### Task 5: Compiled and typed languages references

**Files:**
- Create: `skills/simple-code/references/{go,java,kotlin,spring-boot,csharp,aspnet-core,rust,swift,c-cpp}.md`
- Modify: `skills/simple-code/SKILL.md` (nine index entries)

**Interfaces:** Consumes the Task 2 contract; produces nine indexed files, `spring-boot` pointing at `java.md` and `aspnet-core` at `csharp.md`.

- [ ] **Step 1: Write the references.** Excess to name:
  - `go`: interfaces declared before a second implementation exists, packages for one type, `util` and `common` packages, channels and goroutines where a loop works, error wrapping layers with no new information.
  - `java`: an interface plus `Impl` class for one implementation, builders and factories for plain constructors, inheritance hierarchies where composition or a record works, getters and setters on data that is not hidden, design patterns by name.
  - `kotlin`: extension functions and DSLs for one use, sealed hierarchies for two cases, coroutines and flows where a plain function works, scope functions nested to hide the flow.
  - `spring-boot`: a service and repository interface per entity for simple reads, annotations and configuration classes for what a constructor does, custom auto-configuration, events for a direct call.
  - `csharp`: an interface per class, generic repositories over the ORM, MediatR-style handlers for a direct call, partial classes and extension methods used to hide code.
  - `aspnet-core`: layers per endpoint for a simple query, custom middleware for one route, a service registered for a static function, AutoMapper for a few fields.
  - `rust`: traits for one implementation, lifetimes and generics where owned values are fine, macros for what a function does, `Rc<RefCell<_>>` and `unsafe` to avoid a design change, builder types for plain structs.
  - `swift`: protocols with one conformer, property wrappers and result builders for one use, singleton managers, Combine pipelines where `async/await` reads better.
  - `c-cpp`: templates and inheritance for one type, hand-rolled containers or smart pointers the standard library provides, macros for functions and constants, clever pointer arithmetic where indexing reads better.
- [ ] **Step 2: Add the nine index entries.**
- [ ] **Step 3: Run** `node --test tests/simple-code.test.mjs`, `npm test`, `npm run check`. Expected: PASS.
- [ ] **Step 4: Commit** `git add skills/simple-code`, message `feat(skills): simple-code references for Go, Java, Kotlin, Spring Boot, C#, ASP.NET Core, Rust, Swift, C and C++`.

### Task 6: SQL and shell references

**Files:**
- Create: `skills/simple-code/references/{sql,shell}.md`
- Modify: `skills/simple-code/SKILL.md` (two index entries)

**Interfaces:** Consumes the Task 2 contract; produces two indexed files. After this task the index lists all 25 entries.

- [ ] **Step 1: Add a failing test** to `tests/simple-code.test.mjs`: `the index lists the 25 first-pass references` compares the indexed names with the full list from the spec (14 languages, 11 frameworks, as file names: `javascript typescript python go java kotlin csharp php ruby rust swift c-cpp sql shell react vue nextjs nuxt nodejs-express django fastapi spring-boot laravel rails aspnet-core`). Run it. Expected: FAIL (`sql` and `shell` missing).
- [ ] **Step 2: Write the references.** Excess to name: `sql`: nested subqueries where a join or CTE reads better, dynamic SQL built by string concatenation, views and stored procedures for one query, premature indexes and denormalization, `SELECT *` in application queries. `shell`: functions and option parsers for a one-line command, clever pipelines and process substitution where two lines read better, a missing `set -u`/quoting (state the plain safe habit), portability layers nobody needs, scripts that reimplement what a standard tool does.
- [ ] **Step 3: Add the two index entries.**
- [ ] **Step 4: Run** `node --test tests/simple-code.test.mjs`, `npm test`, `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `git add skills/simple-code tests/simple-code.test.mjs`, message `feat(skills): simple-code references for SQL and shell`.

### Task 7: Bootstrap line, README note and changelog

**Files:**
- Modify: `skills/using-14all/SKILL.md`, `tests/bootstrap.test.mjs`, `README.md`, `tests/docs.test.mjs`, `CHANGELOG.md`

**Interfaces:** Consumes the skill name `simple-code`.

- [ ] **Step 1: Write the failing tests:** in `tests/bootstrap.test.mjs`, `bootstrap points code-writing work at simple-code`: text matches `/Writing or changing code[^\n]*`simple-code`/`. In `tests/docs.test.mjs`, `README says simple-code exists and is unmeasured`: README matches `` /`skills\/simple-code`/ `` and `/unmeasured/i`. Run both. Expected: FAIL.
- [ ] **Step 2: Add to `using-14all`** under "Skill Priority" one bullet: ``- Writing or changing code in a project: `simple-code`.``
- [ ] **Step 3: Add a README section** `## Simple code` (after `## Guard hook`): the skill is `skills/simple-code`, what it does in two sentences, 25 references, and that it is **unmeasured** until an evaluation run exists (name E13 and E14 as the tasks). Add a CHANGELOG `### Added` bullet.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: PASS, and the bootstrap byte test still passes.
- [ ] **Step 5: Commit** `git add -A`, message `feat: point the bootstrap and README at simple-code`.

### Task 8: Grader for the simple-code evaluation tasks

**Files:**
- Modify: `evals/graders.mjs`, `tests/graders.test.mjs`

**Interfaces:**
- Consumes: the existing `isEdit` and `outcome` helpers inside `evals/graders.mjs`, and transcript builders from `tests/transcripts.mjs` (`text`, `edit`, `bash`).
- Produces: `export function gradeE13(events)` (React) and `export function gradeE14(events)` (Vue), both added to `GRADERS`, each returning `{ pass, criticalFailure, checks }`. Internal `gradeSimpleCode(events, forbidden)` where `forbidden` is a list of `{ pattern: RegExp, reason: string }`.

- [ ] **Step 1: Write the failing tests** in `tests/graders.test.mjs`, building transcripts by hand (an edit event needs `input` carrying `content` for `Write`, `new_string` for `Edit`, and `edits: [{ new_string }]` for `MultiEdit`; extend the `edit` builder in `tests/transcripts.mjs` with an optional `input` argument):
  - `E13 passes a small edit that reuses what the project has`: one `Edit` of `src/components/Header.jsx` adding `<span>{notes.length}</span>` and no other edit. Expected `pass: true`, `criticalFailure: null`.
  - `E13 flags a new custom hook as a critical failure`: a `Write` whose content contains `export function useNoteCount()`. Expected `criticalFailure` equal to `defined a new abstraction the task did not need`.
  - `E13 flags createContext, useReducer or a class component the same way` (three cases in one test).
  - `E14 flags defineStore, provide(, and a new composable`: contents `defineStore('count'`, `provide('count'`, `export function useNoteCount`.
  - `a package.json edit is a critical failure named "edited package.json"`, for both graders.
  - Non-critical checks, each failing alone: more than 2 distinct files touched (check name `touched at most 2 files`); more than 40 added lines in total (`added at most 40 lines`); a declared identifier in snake_case, matched by `/\b(?:const|let|function)\s+[a-z0-9]+_[a-z0-9_]+/` (`new identifiers are camelCase`); no edit at all (`made an edit`).
  - `edits the graders ignore are not counted`: an edit event inside a subagent is already excluded by the parser; assert only that `Bash` events do not count as edits.
- [ ] **Step 2: Run** `node --test tests/graders.test.mjs`. Expected: new tests FAIL (`gradeE13 is not a function`).
- [ ] **Step 3: Implement** `gradeSimpleCode(events, forbidden)`: collect the edit events; added text per event is `input.content`, `input.new_string`, or the `new_string` of each item in `input.edits`; critical failures in this order: any edit to a path ending `package.json` gives `edited package.json`; any forbidden pattern found in the added text gives its reason. Checks as named in Step 1 with the thresholds 2 and 40. `gradeE13` forbids `/\bfunction\s+use[A-Z]\w*|\bconst\s+use[A-Z]\w*\s*=/`, `/createContext\(/`, `/useReducer\(/`, `/\bclass\s+\w+\s+extends\s+(React\.)?Component/`, all with reason `defined a new abstraction the task did not need`. `gradeE14` forbids `/defineStore\(/`, `/\bprovide\(/`, `/\bexport\s+(default\s+)?function\s+use[A-Z]\w*|\bconst\s+use[A-Z]\w*\s*=/` with the same reason.
- [ ] **Step 4: Run** `node --test tests/graders.test.mjs` then `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git add evals/graders.mjs tests/graders.test.mjs tests/transcripts.mjs`, message `feat(evals): grader for the simple-code tasks E13 and E14`.

### Task 9: E13 and E14 tasks and fixtures

**Files:**
- Create: `evals/tasks/E13.json`, `evals/tasks/E14.json`
- Create: `evals/fixtures/e13-react-notes/` and `evals/fixtures/e14-vue-notes/` (files below)
- Modify: `tests/eval-tasks.test.mjs` (`IDS`), `evals/README.md` (task table, and the line that says only E1 to E4 exist)

**Interfaces:** Consumes `GRADERS.gradeE13` and `GRADERS.gradeE14` from Task 8 and the task-file shape checked by `tests/eval-tasks.test.mjs`.

- [ ] **Step 1: Write the failing test:** change `IDS` in `tests/eval-tasks.test.mjs` to `['E1', 'E2', 'E3', 'E4', 'E13', 'E14']`. Run `node --test tests/eval-tasks.test.mjs`. Expected: FAIL (task files missing).
- [ ] **Step 2: Create the fixtures.** Both are small, dependency-free source trees (nothing is installed, so the agent cannot run them; the fixture needs a `package.json` with `"type": "module"` and `"scripts": {"test": "node --test"}` and no `dependencies`). Both are deliberately over-built so that the over-built way is the easy one to copy:
  - `e13-react-notes`: `src/App.jsx` renders `NotesProvider` around `Header` and `NotesList`; `src/notes/NotesContext.jsx` creates the context and provider holding a `notes` array; `src/notes/useNotes.js` is a custom hook that reads the context; `src/components/Header.jsx` shows only the title `Notes`; `src/components/NotesList.jsx` maps `useNotes()` to `<li>` items. Style: camelCase variables, PascalCase components, 2 spaces, single quotes, no semicolons.
  - `e14-vue-notes`: `src/App.vue` with `<script setup>` using `AppHeader` and `NotesList`; `src/stores/notes.js` is a Pinia-style store (`defineStore('notes', ...)`) holding a `notes` array; `src/composables/useNotes.js` wraps the store; `src/components/AppHeader.vue` shows only the title; `src/components/NotesList.vue` renders the list through `useNotes()`. Same style.
- [ ] **Step 3: Create the task files** in the shape of `evals/tasks/E3.json`: `id`, `title`, `fixture`, `prompt` (React: `Show the number of notes next to the title in the header.`; Vue: the same sentence), `grader` (`gradeE13`, `gradeE14`), `rubric` (the new code is shorter than the alternatives; it reads like the surrounding files; the report says why the existing layers were or were not reused; a new teammate would follow it on first read) and `criticalFailures` (defined a new abstraction the task did not need; edited package.json).
- [ ] **Step 4: Update `evals/README.md`:** the task table gets rows E13 (`e13-react-notes`) and E14 (`e14-vue-notes`) with their critical failures; the intro line says E1 to E4, E13 and E14 exist.
- [ ] **Step 5: Run** `npm test` and `npm run check`. Expected: PASS.
- [ ] **Step 6: Commit** `git add evals tests/eval-tasks.test.mjs`, message `feat(evals): E13 and E14 tasks and fixtures for the simple-code skill`.

### Task 10: Final verification

**Files:** none created.

- [ ] **Step 1:** `npm test`, `npm run check`, `npm run check:release`. Expected: all exit 0.
- [ ] **Step 2:** `find skills/simple-code/references -name '*.md' | wc -l`. Expected: `25`.
- [ ] **Step 3:** `wc -l skills/simple-code/SKILL.md`. Expected: at most 400.
- [ ] **Step 4:** Push the branch and open a pull request (no direct push to `main`), because the CI runs on macOS and has caught problems the local machine cannot. Expected: both CI jobs pass.
