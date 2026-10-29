# Phase 3: writing for agents, UI checks, done criteria and more lints, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the items of `docs/specs/2026-10-29-phase3-upstream-ideas-design.md`: `writing-for-agents` with an `AGENTS.md` template, a web UI reference for `simple-code`, done-criteria text, four deterministic checks, and 14All's own `AGENTS.md`.

**Architecture:** Each check is a pure function in `scripts/lib/` with unit tests that build inputs in temp directories, plus a thin script in `scripts/`; three join `npm run check`, one is a tool. Skills and references are Markdown under the existing lint and consistency tests.

**Tech Stack:** Node 22 `node:test`, the existing `yaml` dev dependency, `git ls-files` for tracked files (as `scan-secrets` does). No new dependency.

**Spec:** `docs/specs/2026-10-29-phase3-upstream-ideas-design.md` (read it with this plan; item numbers are its numbers).

## Global Constraints

- Skills: only `name` and `description` in the frontmatter; the body of `writing-for-agents` at most 70 lines; `meta.yaml` with `owner: LILLINH`, `maturity: draft`, `last_reviewed: 2026-10-29`; text names actions, not tool names.
- A `simple-code` reference has the exact shape the existing test checks: line 1 `Status: draft, not measured.`, line 3 the title, then exactly the sections `Simple here looks like`, `Do`, `Do not (what agents over-build here)`, `Check before finishing` (3 to 5 questions, each ending `?`), at most 90 lines, no agent tool names; it is listed in the index of `skills/simple-code/SKILL.md`, which stays at most 70 lines.
- Only `writing-for-agents` is adapted (mattpocock/skills `skills/productivity/writing-for-agents/SKILL.md`, v1.3.1, pinned); no new entry in `upstream/sources.json`.
- No path of a real person's home directory in any tracked file after Task 2.
- No README or skill sentence claims an improvement that is not measured; the routing check and the harness audit are described as vocabulary and file-presence checks.
- Commit after each task. Chain `npm test && ... && git commit` with `&&`, never `;`. The whole suite (354 tests at the start) stays green.

## Review Focus

Inputs the spec implies that a happy-path test would miss; each has a test in the task that owns the code.

1. Text check: Vietnamese and other Latin text with diacritics is clean; a word mixing Latin and Cyrillic or Greek letters is flagged; a byte-order mark at the start of a file is flagged; a zero-width joiner inside an emoji sequence is not flagged but a lone zero-width space is (Task 1).
2. Path check: `/home/runner/`, `/Users/you/`, `~/` and `$HOME` are clean; a home path under a made-up person's name, on Linux, macOS and Windows, is flagged; a path inside a URL is not (Task 2).
3. Routing check: a case naming a skill that does not exist fails; a `known-gap` case without a reason fails; a known gap is reported but does not fail; two identical descriptions are a collision; a prompt sharing no word with any description does not crash (Task 3).
4. Harness audit: `CLAUDE.md` containing only `@AGENTS.md` is followed to `AGENTS.md`; a 33 KiB instruction file is a critical failure and exit status 1; an empty directory is 0 of 8 with a critical failure; a nested `tests/` directory counts (Task 4).
5. `writing-for-agents` keeps the upstream core, its `meta.yaml` source path exists in the pinned clone, the template is under 32 KiB, and the skill does not contradict the size limits other skills and the harness audit state (Task 5).

---

### Task 1: Check for invisible and mixed-script characters (item 4)

**Files:**
- Create: `scripts/lib/text-safety.mjs`, `scripts/check-text.mjs`
- Modify: `package.json` (add `node scripts/check-text.mjs` to `check`)
- Test: `tests/text-safety.test.mjs` (new)

**Interfaces:**
- Produces: `findUnsafeText(text) -> { line: number, kind: 'invisible' | 'mixed-script', detail: string }[]` (`detail` is a code point such as `U+200B` or the script names, never the text). The script checks tracked files with the extensions `.md .json .mjs .yaml .yml` and the files under `hooks/`, skipping `tests/fixtures/secrets/` and files that no longer exist, and prints `file:line: kind (detail)`.

- [ ] **Step 1: Write the failing tests**, building strings with escapes (`'\u200b'`), never with the literal characters: clean ASCII, clean Vietnamese (`đường dẫn, ệ`), clean emoji with a zero-width joiner (`'\u{1F468}\u200D\u{1F469}'`) give `[]`; a lone `\u200b`, a `\u202e`, a `\u2066`, a `\u2060`, a `\ufeff` at the start of the text each give one `invisible` finding with the right line; a word like `p\u0430ypal` (Cyrillic а inside Latin) and one with a Greek letter inside a Latin word give `mixed-script`; a Greek-only word (`μs`) and a Cyrillic-only word are clean.
- [ ] **Step 2: Run** `node --test tests/text-safety.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `findUnsafeText` (invisible set: U+200B to U+200F, U+202A to U+202E, U+2060 to U+2064, U+2066 to U+2069, U+FEFF; a U+200D between two `\p{Extended_Pictographic}` characters is allowed; words are runs of `\p{L}\p{M}\p{N}_`, mixed when a run holds Latin letters and Cyrillic or Greek ones) and `scripts/check-text.mjs` (exit 1 on any finding). Add it to the `check` chain.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS. If `npm run check` flags a tracked file, look at the finding: fix a real problem; if the text is legitimate, record a `Ruling:` and narrow the rule, not the file list.
- [ ] **Step 5: Commit** `feat(check): refuse invisible and mixed-script characters`.

### Task 2: Check for personal home paths (item 4)

**Files:**
- Create: `scripts/lib/personal-paths.mjs`, `scripts/check-paths.mjs`
- Modify: `package.json` (add to `check`), and every tracked file the check flags (known: `docs/specs/2026-10-28-14all-design.md`, `docs/plans/2026-10-29-phase2-upstream-ideas.md`)
- Test: `tests/personal-paths.test.mjs` (new)

**Interfaces:**
- Produces: `findPersonalPaths(text) -> { line: number }[]` (never the path itself). A path is `/home/<name>/`, `/Users/<name>/` or `C:\Users\<name>\` at the start of a line or after whitespace, a quote, a backtick, `(`, `=` or `:`; clean when `<name>` is one of `user`, `you`, `me`, `name`, `username`, `example`, `runner`. Same file set and exit rule as Task 1.

- [ ] **Step 1: Write the failing tests**: a home path under a made-up name is flagged on Linux, macOS and Windows, after a space, a quote, a backtick or `=`; `runner`, `you`, `user`, `name`, `username`, `example`, a one-letter name, `~/` and `$HOME` are clean; a path inside a URL or after `/usr` is clean; the line number is right on a multi-line text; a line with several paths is one finding. The test file builds its paths from parts so it holds no such path itself.
- [ ] **Step 2: Run** `node --test tests/personal-paths.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `findPersonalPaths` and `scripts/check-paths.mjs`; add it to `check`. Run `node scripts/check-paths.mjs`, and for each flagged tracked file replace the path with a placeholder (`<repo>`, `/home/user/...`) keeping the meaning of the sentence.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS with no flagged file.
- [ ] **Step 5: Commit** `feat(check): refuse personal home paths; replace this machine's in the docs`.

### Task 3: Check skill routing and collisions (item 4)

**Files:**
- Create: `scripts/lib/routing.mjs`, `scripts/check-routing.mjs`, `evals/routing/cases.json`
- Modify: `package.json` (add to `check`)
- Test: `tests/routing.test.mjs` (new)

**Interfaces:**
- Produces: `rankSkills(prompt, skills) -> { name, score }[]` sorted by cosine similarity of TF-IDF vectors (lowercased word tokens, no stop words, `skills` is `{ name, description }[]` and a skill's text is its name with hyphens as spaces plus its description); `findCollisions(skills, threshold = 0.75) -> [nameA, nameB, score][]`; `checkRouting({ skills, cases, topK = 3, threshold = 0.75 }) -> { problems: string[], gaps: string[] }`. A case is `{ skill, prompt, status?: 'known-gap', reason? }`. A problem: an unknown skill name, an expected skill outside the top `topK`, a collision, a `known-gap` with no `reason`. A `known-gap` case that misses goes to `gaps` (reported, not a problem); one that passes is a problem ("no longer a gap").

- [ ] **Step 1: Write the failing tests** with synthetic skills: a passing case gives no problem; a case whose skill is outside the top 3 is a problem; an unknown skill name is a problem; two identical descriptions are a collision; a `known-gap` that misses is in `gaps` and not in `problems`; a `known-gap` without `reason` is a problem; a prompt sharing no word with any description returns the skills without crashing (all scores 0).
- [ ] **Step 2: Run** `node --test tests/routing.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write `evals/routing/cases.json` first, before running anything.** Two prompts for each of the 20 existing skills, each written as a person would ask, in plain words, without copying phrases from the descriptions. Then implement `routing.mjs` and `scripts/check-routing.mjs` (reads `skills/*/SKILL.md` through `parseSkillFile`, prints problems and the count of known gaps, exit 1 on any problem). Add it to `check`.
- [ ] **Step 4: Run** `node scripts/check-routing.mjs`. If a case misses or two descriptions collide, do not edit a description or a prompt to make it pass. Mark each missing case `"status": "known-gap"` with a one-line `reason`, and record a `Ruling:` listing the gaps; the final message tells the owner. Then `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(check): skill descriptions must route and not collide`.

### Task 4: The agent-readiness audit, `check:harness` (item 4)

**Files:**
- Create: `scripts/lib/harness.mjs`, `scripts/check-harness.mjs`
- Modify: `package.json` (script `"check:harness": "node scripts/check-harness.mjs"`; not in `check`)
- Test: `tests/harness.test.mjs` (new)

**Interfaces:**
- Produces: `auditHarness(dir) -> { checks: { id: string, name: string, pass: boolean, critical: boolean }[], present: number, total: 8 }`. The eight checks: `instruction-file` (AGENTS.md or CLAUDE.md at the root; a `CLAUDE.md` whose text has a line `@<file>` also reads that file), `size` (largest instruction file at most 32768 bytes, critical), `test-command`, `build-command` (a command that builds, starts or checks: build, run, start, dev, lint, check, typecheck, make), `has-tests` (a `test`, `tests`, `spec` or `__tests__` directory or a `*.test.*`, `*.spec.*`, `*_test.*` or `test_*.py` file within four levels, skipping `node_modules` and `.git`), `ci-config` (`.github/workflows/*.yml|yaml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `azure-pipelines.yml`, `Jenkinsfile`), `few-hard-rules` (at most 15 lines with MUST, NEVER or ALWAYS), `progress-convention` (the instruction text mentions progress, handoff or `.14all`). `scripts/check-harness.mjs <dir>` prints `N of 8 present`, each failed check by name, and a line saying it checks words and files, not that the harness works; exit 1 only when a critical check fails.

- [ ] **Step 1: Write the failing tests** with temp repos: a complete repo is 8 of 8; each check fails alone when its thing is removed; `CLAUDE.md` containing `@AGENTS.md` is followed; a 33 KiB `AGENTS.md` fails `size` and the script exits 1 (spawn the script); an empty directory is 0 of 8 with a critical failure; a nested `a/b/tests/` counts; a repo that only has `node_modules/x/test/` does not.
- [ ] **Step 2: Run** `node --test tests/harness.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `auditHarness` and the script. Add the npm script.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(check): an agent-readiness audit for any repository`.

### Task 5: Skill `writing-for-agents` and the `AGENTS.md` template (item 1)

**Files:**
- Create: `skills/writing-for-agents/SKILL.md`, `skills/writing-for-agents/meta.yaml` (class `adapted`, source `mattpocock/skills`, ref `v1.3.1`, license `MIT`, path `skills/productivity/writing-for-agents/SKILL.md`), `skills/writing-for-agents/references/agents-md-template.md`
- Modify: `THIRD_PARTY_NOTICES.md` (add `## writing-for-agents`)
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing tests**: meta and notice and source-path-in-the-pinned-clone checks as for `research`; the skill text names context pointers, the two loads, the information hierarchy, completion criteria, saying what to do instead of prohibiting, pruning and a skill's frontmatter rule (description starts "Use when", under 400 lines), and points to `references/agents-md-template.md`; at most 70 lines; the template exists, is under 32768 bytes, under 100 lines, and has the headings `What this is`, `Commands`, `Layout`, `Conventions`, `Verify before you say done`, `Do not touch`, `Where more is written`; the skill's directory passes `lintSkillDir`.
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write the skill, the template and the notice** per spec item 1 (description: `Use when creating or editing a skill, an AGENTS.md or CLAUDE.md, or any other document an agent will read.`). `meta.yaml` `changed.summary` lists what was kept (the seven ideas), condensed (examples, the long treatment of leading words and splitting), and added (the 14All frontmatter rule, the `AGENTS.md` template pointer, the 32 KiB limit).
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS (lint, notices and sources checks included).
- [ ] **Step 5: Commit** `feat(skills): add writing-for-agents`.

### Task 6: The web UI reference for `simple-code` (item 2)

**Files:**
- Create: `skills/simple-code/references/web-ui.md`
- Modify: `skills/simple-code/SKILL.md` (one index line)
- Test: `tests/simple-code.test.mjs`

- [ ] **Step 1: Write the failing test** `the web UI reference puts the project's design system first, checks three widths, limits the render loop and says so when there is no browser`: matches `design system`, `375`, `768`, `1440`, `at most three`, `production build`, `contrast`, `no browser`; the existing shape and index tests must pass with it (they fail now because the file is missing from the index only after it exists, so write the file and the index line in Step 3 together).
- [ ] **Step 2: Run** `node --test tests/simple-code.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write the reference** in the exact shape (spec item 2: the priority order and the render-and-look loop and critique passes under `Do`; the over-builds under `Do not`; three to five checks under `Check before finishing`, for example "Does it work at 375, 768 and 1440 pixels wide?", "Do colours and sizes come from the project's tokens?", "Does every image have a size and alternative text?") and add `- `references/web-ui.md`: ...` to the index, for `.html`, `.css`, `.scss`, `.vue`, `.svelte` files or a component that returns markup, read with the language reference.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS; `SKILL.md` is at most 70 lines.
- [ ] **Step 5: Commit** `feat(simple-code): a web UI reference`.

### Task 7: Definition of Done, and rollout and rollback (item 3)

**Files:**
- Modify: `skills/verification-before-completion/SKILL.md`, `skills/finishing-a-development-branch/SKILL.md`
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing tests**: `verification-before-completion` has a `Definition of done` section naming acceptance criteria and standing conditions (the verifying command passes fresh, no new warning or skipped test, no debug leftover, the docs and changelog that the change touches, the request answered); `finishing-a-development-branch` has an `If the change reaches users` section naming how it reaches them, what shows it going wrong and how it is undone; both under 400 lines.
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Add the two sections** (about 8 lines each) as spec item 3 says.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(skills): a definition of done and a rollout note`.

### Task 8: 14All's own `AGENTS.md` and `CLAUDE.md` (item 5)

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`
- Test: `tests/harness.test.mjs`

- [ ] **Step 1: Write the failing test** `the repository passes its own agent-readiness audit`: `auditHarness(repoRoot)` has no failed critical check and `present >= 7`; `AGENTS.md` is at most 80 lines; `CLAUDE.md` is the single line `@AGENTS.md`.
- [ ] **Step 2: Run** `node --test tests/harness.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write `AGENTS.md`** from the template (spec item 5), with the commands as one line each, and `CLAUDE.md` with its one line. Do not restate what `package.json` scripts or `CONTRIBUTING.md` already say beyond a pointer.
- [ ] **Step 4: Run** `npm test && npm run check && npm run check:harness -- .`. Expected: PASS; read the audit output and say which checks are present.
- [ ] **Step 5: Commit** `docs: AGENTS.md and CLAUDE.md for this repository`.

### Task 9: Docs and credits

**Files:**
- Modify: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`
- Test: `tests/docs.test.mjs`

- [ ] **Step 1: Write the failing tests**: the README names `skills/writing-for-agents`, the web UI reference, `npm run check:harness` and says the routing check and the audit measure words and files, not whether a model chooses correctly; CONTRIBUTING lists the three new checks and points to `writing-for-agents` for writing a skill; the changelog mentions `writing-for-agents`, `web-ui`, `check:harness`, `check-routing`, `check-text` and `check-paths`; the credits name ui-ux-pro-max, taste-skill, learn-harness-engineering, the ECC lints and agent-skills' done criteria and routing check, and still say no text was copied; the README's skill count statements, if any, are not stale.
- [ ] **Step 2: Run** `node --test tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Update the docs.** README: a section on writing for agents, the UI reference and the checks, drafts and unmeasured, and a plain sentence on what the checks cannot show. CONTRIBUTING: the checks and the skill. CHANGELOG: entries. Credits: the Phase 3 ideas with their licenses (ui-ux-pro-max and taste-skill MIT, their data and images not used).
- [ ] **Step 4: Run** `npm test && npm run check && npm run check:release && npm run check:harness -- .`. Expected: all PASS; read the output.
- [ ] **Step 5: Commit** `docs: Phase 3 of the upstream ideas`.

### Task 10: A live listing check (item 6)

**Files:**
- Modify: `docs/evidence/claude-code.md`, `README.md` (only if the result differs from what it says)

- [ ] **Step 1: Run** from a temporary directory outside the repository: `claude -p "reply with the word ok" --plugin-dir <repo> --setting-sources project,local --no-session-persistence --output-format stream-json --verbose`, and read the `skills` array of the first `system` message with subtype `init`. This calls a model once for a one-word reply. Expected: `14all:writing-for-agents` is listed.
- [ ] **Step 2: Record the result honestly** in `docs/evidence/claude-code.md` (date, version, the skill names seen or not seen, and what it does not show: that the skill is chosen or followed). If it is not listed, record that, add a `Ruling:`, and find out why before changing anything.
- [ ] **Step 3: Run** `npm test`. Expected: PASS.
- [ ] **Step 4: Commit** `docs: evidence for writing-for-agents`. Then request one `code-review` of the whole branch against the spec.

---

## Self-review notes

- Spec coverage: item 1 → Task 5; 2 → 6; 3 → 7; 4 → 1 to 4; 5 → 8; 6 → 10; item 7 (dropped) has no task, and Task 9 does not mention the gate or `skill-comply` except as later work.
- One refinement of the spec: the harness check `build-command` also counts a lint or check command (the spec says "builds or starts"), because this repository has nothing to build and the audit must not penalise a plugin for that. It is the owner's to reverse.
- Task 3 is deliberately written so a failing case is reported and not tuned away; the `known-gap` status is the honest outlet.
- The plan is about 3 times the length of the spec's item list because the four checks need their interfaces written out; the bodies of the functions are left to the implementer.
