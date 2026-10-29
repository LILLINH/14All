# Phase 3: writing for agents, UI checks, done criteria and more lints

Date: 2026-10-29. Status: draft, awaiting owner approval. Nothing has been built.

This is the third of three phases. Phase 1 (`docs/specs/2026-10-29-phase1-upstream-ideas-design.md`) and Phase 2 (`docs/specs/2026-10-29-phase2-upstream-ideas-design.md`) are built on the branches `feat/phase1-upstream-ideas` and `feat/phase2-upstream-ideas`, neither merged. This phase is stacked on the second. The owner approved the Phase 3 list in chat ("ok") on 2026-10-29; this document changes it in one place (item 7, below). Every claim about a source repository was read from a shallow clone at the commit the research report names; benchmark numbers in those repositories are the authors' own.

## Intent

Phases 1 and 2 gave 14All behaviour. Phase 3 makes it easier to write the documents agents read (skills, `AGENTS.md`), adds a UI check that does not exist yet, raises the bar for "done", and adds cheap deterministic checks so the repository and the repositories it is used in stay in good shape. Nothing here is measured, and nothing here may be described as measured.

## Goals

1. One adapted skill, `writing-for-agents` (skills go from 20 to 21), with an `AGENTS.md` template under 32 KiB.
2. A web UI reference for `simple-code`, with a pre-delivery checklist and a render-and-look loop.
3. A Definition of Done and a rollout-and-rollback note, added to two existing skills.
4. Three new checks in `npm run check` (invisible or mixed-script characters, personal paths, skill-description routing and collisions) and one tool, `npm run check:harness`, that audits a repository for agent-readiness.
5. 14All's own `AGENTS.md` and `CLAUDE.md`, written from the template, so `check:harness` has a real subject and passes on this repository.

## Non-goals

- No new skill for UI work, and no dataset, search engine or generated style catalogue (ui-ux-pro-max, taste-skill): only a short reference.
- No hook, daemon, MCP server or dependency.
- No evaluation is run, and no model is called except one live listing check at the end (item 6).
- Not built here: the first-edit "fact-forcing" gate and the `skill-comply` evaluation (item 7).

## Anti-goals (failure even if it works)

- A UI reference that forces a house style on a project that has its own design system.
- A routing check tuned until it passes, which proves nothing: the cases are written from what a person would say, before the check is run, and a failing case is reported, not "fixed" by editing the description to match.
- A check that flags the repository's own legitimate text (Vietnamese or other non-ASCII prose, placeholder paths) so often that it is switched off.
- An `AGENTS.md` that repeats what the repository's scripts already say.

## Constraints

- The Phase 1 and 2 constraints hold: skill frontmatter has only `name` and `description`; a skill is under 400 lines (the 70-line limit of Phase 2 applies to the skill body here too, with the template and mechanics in `references/`); `meta.yaml` with `owner: LILLINH`, `maturity: draft`; text names actions, not tool names; hooks are untouched.
- A `simple-code` reference has the shape the existing test checks (`Status: draft, not measured.`, then the same headings as the others) and is listed in the index in `SKILL.md`.
- New checks use Node and no new dependency; they read tracked files with `git ls-files`, as `scan-secrets` does.

## Licenses

| Source | License | Use |
|---|---|---|
| mattpocock/skills `writing-for-agents` (pinned v1.3.1) | MIT | Adapted into `writing-for-agents`; notice entry added |
| learn-harness-engineering | MIT | Ideas only: the `AGENTS.md` template layout, the audit checks |
| ui-ux-pro-max, taste-skill | MIT (their data and example images are not) | Ideas only: the priority order of rules, the render-and-look loop; no data copied |
| agent-skills, ECC | MIT | Ideas only: Definition of Done, rollout and rollback, the routing check, the invisible-character and personal-path lints |

No new source is pinned. A passage copied from any source other than the pinned one first pins that source in `upstream/sources.json`, and this document changes.

## The items

### 1. Skill `writing-for-agents`, adapted

Class `adapted` from `skills/productivity/writing-for-agents/SKILL.md` (v1.3.1, pinned; its `SKILL-MECHANICS.md` is also read for the skill-writing part). The upstream skill is about 90 lines of dense theory; the adaptation keeps the working core in at most 70 lines and moves the rest behind pointers:

- **Context pointers:** a skill description or a line in `AGENTS.md` is a pointer; its wording decides when the agent reaches the material; front-load the leading word, one trigger per branch.
- **Two loads:** always-loaded text costs the agent's context on every turn; the number of documents costs the human attention. Spend each where it earns it.
- **Information hierarchy:** steps first; reference on demand; disclosed reference behind a pointer. Inline what every branch needs; push behind a pointer what only some branches reach.
- **Completion criteria:** every step ends on a condition the agent can check, and the strongest are checkable and exhaustive.
- **Say what to do:** a prohibition drags the forbidden thing into view; state the target behaviour, and keep a prohibition only for a hard guardrail.
- **Pruning:** one source of truth; do not restate what a script, a config file or `--help` already says; delete a sentence that does not change behaviour from the default.
- **For a skill:** the frontmatter is `name` and `description`; the description starts "Use when" and names the situation, not the steps; under 400 lines; detail in `references/`; `npm run new-skill` creates one that passes the lint.

`references/agents-md-template.md` is a fill-in template for `AGENTS.md` (original layout, ideas from the learn-harness-engineering template): what the project is in two lines; the commands to build, test and run (written as the commands, one line each); the layout in a few lines; conventions that no config file states; how to verify before saying done; what must not be touched; where longer docs are. It says to keep the file under 32 KiB (Codex's default limit) and well under 200 lines, to delete any line a script already says, and to link longer material instead of pasting it.

Tests: lint, notices and sources checks; a consistency test for the seven ideas and the pointer to the template; a test that the template is under 32 KiB and has every section heading. `meta.yaml` records what was kept, condensed and moved. A `## writing-for-agents` entry goes into `THIRD_PARTY_NOTICES.md`.

### 2. A web UI reference for `simple-code`

`skills/simple-code/references/web-ui.md`, about 60 lines, in the existing reference shape, listed in the index for the files a UI is made of (`.html`, `.css`, `.scss`, `.vue`, `.svelte`, a component that returns markup). Original wording on these ideas:

- **The project's design system first.** Use its tokens, components and spacing; a new look is for a project that has none.
- **Priority order of what to check**, highest first: accessibility (contrast of at least 4.5 to 1 for text, keyboard use, labels, focus visible), touch targets (about 44 px), layout at small widths, performance (no layout shift from images without a size), typography, motion (respect a "reduce motion" setting), forms (errors say what to fix).
- **Pre-delivery checklist:** works at 375, 768 and 1440 px wide; light and dark checked on their own when both exist; no icon made of an emoji; colours and sizes from tokens, not typed in; images have a size and alternative text.
- **Render and look.** Open the page in a real browser at three widths, take a screenshot of each and judge the picture, not the code; fix the three worst problems; repeat at most three times. Check the production build, not only the development server (a minifier has dropped a style that the development build had). When no browser is available, say so: the visual check was not done.
- **Critique passes**, a few cheap ones: a glance of one second (is the main thing obvious?), squint (does the structure show?), cover the logo (is it still recognisable as this product?), count the left edges, look at the small screen as its own composition.
- **Do not (what agents over-build here):** a new colour or font for one page; a component library added for one control; animation with no purpose; fixed pixel layouts.

Tests: the shape test and the index test of `simple-code` pass with it; a consistency test for the design-system-first rule, the three widths, the loop limit and the "say so when no browser" rule. Ideas credited: ui-ux-pro-max, taste-skill.

### 3. Definition of Done, and rollout and rollback

- `verification-before-completion` gains a short "Definition of done" section (about 8 lines). A task is done when the acceptance criteria are met **and** the standing conditions hold: the verifying command passes fresh, no new warning or skipped test, no debug leftover, the docs and changelog that the change touches are updated, and the user's request is answered, not only the code written. Acceptance criteria are what the task asked; the standing conditions are what every task owes.
- `finishing-a-development-branch` gains an "If the change reaches users" section (about 8 lines): before merging a change that users will see, state how it will reach them (all at once or in steps), what would show it is going wrong, and how it is undone (a revert, a switch, a migration back); a change that cannot be undone is said to be so.

Tests: consistency tests for the phrases above; both skills stay under 400 lines. Ideas credited: agent-skills (`shipping-and-launch`, `definition-of-done`).

### 4. Three new checks and one audit tool

All four are deterministic, use no model and no dependency, and have unit tests that build their inputs in temporary directories.

- **`scripts/check-text.mjs` (in `npm run check`).** For every tracked `.md`, `.json`, `.mjs`, `.yaml`, `.yml` file and the hook scripts: fail on an invisible or bidirectional control character (U+200B to U+200F, U+202A to U+202E, U+2060 to U+2064, U+2066 to U+2069, U+FEFF anywhere), and on a word that mixes Latin letters with Cyrillic or Greek ones (the homoglyph trick). Vietnamese and other Latin letters with diacritics are fine. Idea credited: ECC's `check-unicode-safety`.
- **`scripts/check-paths.mjs` (in `npm run check`).** For the same files: fail on a home-directory path of a real person (`/home/<name>/`, `/Users/<name>/`, `C:\Users\<name>\`) unless the name is a known placeholder (`user`, `you`, `me`, `name`, `username`, `example`, `runner`). The repository's own plans and evidence that name this machine's home directory are changed to a placeholder as part of the build. Idea credited: ECC's `validate-no-personal-paths`.
- **`scripts/check-routing.mjs` (in `npm run check`) and `evals/routing/cases.json`.** For every skill, two or more short prompts written the way a person would ask for it, with the skill that should answer. The check scores each prompt against each skill's name and description with a plain TF-IDF cosine and fails when the expected skill is not in the top three, and when two skills' descriptions are more than 0.75 alike (a collision). It tests that descriptions share words with plausible requests and do not blur into each other; it does not test that a model picks the right skill, and the document says so. The cases are written before the check is run; a failing case is reported to the owner, and the description is not edited to make it pass without a stated reason. Idea credited: agent-skills' routing evaluation.
- **`scripts/check-harness.mjs <dir>` (`npm run check:harness -- <dir>`, a tool, not part of `npm run check`).** Audits a repository for agent-readiness with eight checks: an instruction file (`AGENTS.md` or `CLAUDE.md`) exists; it is under 32 KiB (critical); it names a command that tests; it names a command that builds or starts the project; the repository has tests; a continuous-integration configuration exists; the instruction file holds at most 15 hard rules (lines with MUST, NEVER or ALWAYS); it names a place for progress notes or handoffs. It prints `N of 8 present` and which failed, and exits 1 only when a critical check fails. It checks the presence of words and files, not that the harness works: its output says so. Idea credited: learn-harness-engineering's `audit-harness.sh`; the checks and the code are original.

### 5. 14All's own `AGENTS.md` and `CLAUDE.md`

`AGENTS.md` at the repository root, under 80 lines, written from the template: what 14All is, the commands (`npm test`, `npm run check`, `npm run new-skill`), the layout, the conventions no config states (the Phase 1 and 2 constraints in this document, the license rule, the evidence rule), how to verify, what not to touch (`evals/runs/*/raw/`, `.upstream/`), and where the longer docs are. `CLAUDE.md` holds one line, `@AGENTS.md`. `npm run check:harness -- .` passes on the repository, and a test asserts that.

Claude Code does not load a `CLAUDE.md` at a plugin's root as context for the plugin's users (the first design says so), so this affects only people working on 14All itself.

### 6. A last live listing check

As in Phase 2: one short headless session with `--plugin-dir`, reading the `skills` list of the first `system` message, to see `14all:writing-for-agents` listed. It calls a model once for a one-word reply. The result goes into `docs/evidence/claude-code.md` with what it does not show.

### 7. Dropped from the approved list: the fact-forcing gate and `skill-comply`

- **The first-edit "fact-forcing" gate (ECC gateguard).** The research found its own evidence weak (two tasks, the author's own run), and it needs a hook that tracks state across tool calls. It is to be built only if an evaluation shows it helps, so it is not built now.
- **The `skill-comply` evaluation** (does the agent actually follow a skill, at three levels of prompt strictness). It needs live model runs to find out whether the design works, and building the mechanism without running it would add an unproven piece to the evaluation harness. It is better designed after E15 and the earlier evaluations have been run.

Both stay on the list of later work. This is my call; the owner can ask for either.

## Build order

One branch, `feat/phase3-upstream-ideas`, stacked on `feat/phase2-upstream-ideas`. The checks first (text, paths, routing, harness), then `writing-for-agents`, the web UI reference, the done-criteria text, `AGENTS.md` and `CLAUDE.md`, the docs and credits, and the live listing check. One commit per item, tests first. After the last: `npm test`, `npm run check`, `npm run check:release` and `npm run check:harness -- .` green, and one `code-review` of the whole branch by a fresh reviewer on the most capable model.

## Honesty

- New skills, references and the `AGENTS.md` are drafts. Nothing says they improve results; no evaluation covers them.
- The routing check and the harness audit measure vocabulary and file presence. Their output and the documentation say so.
- The one live check shows a skill is listed, not that it is used.

## My calls the owner has not confirmed

1. The fact-forcing gate and `skill-comply` are not built (item 7).
2. The UI guidance is a reference inside `simple-code`, not a skill, so the skill count stays at 21 and the file-based selection of `simple-code` decides when it is read.
3. 14All gets its own `AGENTS.md` and `CLAUDE.md` (item 5), which the owner did not ask for in this phase; it was in the first design's layout.
4. The routing check's thresholds (top three, 0.75) are my choice and unmeasured.
5. The personal-path check lists its placeholder names itself; and the repository's own plans and evidence are edited to remove this machine's home directory.
6. English text, as before.

## Left to the builder

The wording of the skill, the reference, the template, `AGENTS.md`; the routing cases (the prompts); the exact regular expressions of the text and path checks; names of tests.
