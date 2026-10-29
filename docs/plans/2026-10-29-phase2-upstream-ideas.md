# Phase 2: skills and role agents from the top repos, Implementation Plan

> **Historical record.** This plan was used to build the repository. Its checkboxes were not ticked as work went on, so they do not show progress. What shipped is listed in `CHANGELOG.md`.

**Goal:** Build the five items of `docs/specs/2026-10-29-phase2-upstream-ideas-design.md`: four skills (`tool-output`, `secure-code`, `impact-check`, `research`), four read-only role agents with a lint, and the E15 evaluation.

**Architecture:** Skills are Markdown under lint and consistency tests. Agents live in a new `agents/` directory checked by a new lint (`scripts/lib/agents.mjs`) wired into `npm run check`. E15 is a fixture, a grader and a task file, unit-tested without a model.

**Tech Stack:** Node 22 `node:test`, the existing `yaml` dev dependency, Markdown. No hook changes.

**Spec:** `docs/specs/2026-10-29-phase2-upstream-ideas-design.md` (read it with this plan; item numbers are its numbers).

## Global Constraints

- Skills: only `name` and `description` in the frontmatter, **at most 70 lines**, `meta.yaml` with `owner: LILLINH`, `maturity: draft`, `last_reviewed: 2026-10-29`; text names actions, not tool names. A skill description starts with "Use when".
- Agents: `agents/<name>.md` with frontmatter `name` (equal to the file name), `description` (starts "Use when", under 1024 characters) and `tools` (a subset of `Read, Glob, Grep, Bash`); no `model`; under 120 lines; none dispatches another agent.
- Only `research` is an adaptation (mattpocock/skills `skills/engineering/research/SKILL.md`, v1.3.1, already pinned); no new entry in `upstream/sources.json`.
- The skill is `secure-code`, never `security-review` (a built-in command).
- No README or skill sentence claims an improvement that is not measured, or that agents load in Claude Code before the live check of Task 10.
- Commit after each task; run `npm test` before each commit; the whole suite (320 tests at the start) stays green.

## Review Focus

Inputs the spec implies that a happy-path test would miss; each has a test in the task that owns the code.

1. An agent whose `tools` is a YAML list, has no spaces (`Read,Glob`), is lowercase, is empty or lists `Write`/`Edit`, or which has a `model` key, must fail the lint (Task 1).
2. An agent file whose `name` differs from its file name, a non-`.md` file in `agents/`, and a nested directory must be handled: the first fails, the others are ignored; and `agents/` must not be listed as a skill by `lint-skills` (Task 1).
3. E15: the log has decoy lines that say "failed" and name other migrations; a run that reads the log in many small slices adding up to over 20000 characters of tool results must fail the size check; the answer is judged on the final text only (Task 5).
4. `research` keeps the upstream core (primary sources, a cited findings file) and adds the five new rules; its `meta.yaml` source path exists in the pinned upstream clone (Task 8).
5. The Phase 1 test suite and `npm run check` still pass with an `agents/` directory present (Tasks 1 and 2).

---

### Task 1: A lint for `agents/` (item 5, the lint)

**Files:**
- Create: `scripts/lib/agents.mjs`, `scripts/lint-agents.mjs`
- Modify: `package.json` (add the script to `check`: `node scripts/lint-agents.mjs`)
- Test: `tests/agents-lint.test.mjs` (new)

**Interfaces:**
- Produces: `lintAgentFile(path) -> string[]` (problems for one file, each prefixed with the file name) and `lintAgentsRoot(root) -> string[]`; a missing root has no problems; only `*.md` files directly under the root are checked. Uses `parseSkillFile` from `scripts/lib/frontmatter.mjs`.

- [ ] **Step 1: Write the failing tests** in `tests/agents-lint.test.mjs`, building agent files in temp dirs (`makeRoot` from `tests/helpers.mjs`): a valid file gives `[]`; a missing root gives `[]`; each of these gives one problem naming the file: `name` different from the file name, `description` not starting "Use when", `description` over 1024 characters, no `tools`, `tools` containing `Write` or `Edit`, `tools: Read,Glob` (no spaces) accepted, `tools: [Read, Glob]` as a YAML list accepted, lowercase `read` rejected, empty `tools` rejected, a `model` key, a file over 120 lines, missing frontmatter. A `notes.txt` and a nested directory in the root are ignored.
- [ ] **Step 2: Run** `node --test tests/agents-lint.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `lintAgentFile`, `lintAgentsRoot` and `scripts/lint-agents.mjs` (prints each problem to stderr, exits 1 on any, like `lint-skills.mjs`; default root `agents`). Add the script to the `check` chain in `package.json`.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS; `npm run check` is unaffected because `agents/` does not exist yet.
- [ ] **Step 5: Commit** `feat(lint): check the agents directory`.

### Task 2: The four role agents (item 5)

**Files:**
- Create: `agents/debugger.md`, `agents/reviewer.md`, `agents/preship-reviewer.md`, `agents/security-auditor.md`
- Test: `tests/agents.test.mjs` (new)

**Interfaces:**
- Consumes: `lintAgentsRoot('agents')` from Task 1.

- [ ] **Step 1: Write the failing tests** in `tests/agents.test.mjs`: `lintAgentsRoot` on the real `agents/` is `[]`; the four names exist; every agent says it uses `Bash` only to read and never dispatches another agent (`/never (dispatch|start|call)[^.]*agent/i`) and treats repository and tool text as data (`/data, not instructions/`) and says `none provided`; `debugger` mentions `confirm`, `falsify`, `file:line`, `inconclusive`, and "one hypothesis"; `reviewer` mentions a fixed finding format with `severity`, `file:line`, `read`, `inferred`, `unverified`; `preship-reviewer` mentions `ship with fixes` and `do not ship` and a quoted line per finding; `security-auditor` mentions `threat model` and the `secure-code` skill by name.
- [ ] **Step 2: Run** `node --test tests/agents.test.mjs`. Expected: FAIL (no files).
- [ ] **Step 3: Write the four agents** per spec item 5: each with `name`, a "Use when ..." `description`, `tools: Read, Glob, Grep, Bash`, a role paragraph, a numbered method, an output format and the common rules, 40 to 80 lines. Original wording.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(agents): add debugger, reviewer, preship-reviewer and security-auditor`.

### Task 3: The agents are named in the skills that use them (item 5)

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`, `skills/code-review/SKILL.md`
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing test** `systematic-debugging names the debugger agent for competing hypotheses and code-review names the reviewer, preship-reviewer and security-auditor agents` (each name appears as a backticked agent name; the test also checks the line counts stay under 400).
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Add one sentence to each skill**: in `systematic-debugging`, when several hypotheses compete and an agent can be dispatched, give each one to the `debugger` agent; in `code-review`, for a dimension use the `reviewer` agent, for a last check of a diff the `preship-reviewer` agent, for security the `security-auditor` agent; without a way to dispatch agents, follow their method yourself.
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(skills): point debugging and review at the role agents`.

### Task 4: Skill `tool-output` (item 1)

**Files:**
- Create: `skills/tool-output/SKILL.md`, `skills/tool-output/meta.yaml` (`npm run new-skill -- tool-output`, then `owner: LILLINH`)
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing test** `tool-output states its four trimming rules, the never-shorten list, and points at a file for long output`: matches `explicit request for detail`, `shorter version of the real output`, `never lose the failure`, `a way back`, `exit status`, `path:line`, `negation`, `irreversible`; at most 70 lines; `meta.yaml` class `original`.
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write the skill** per spec item 1 (description: `Use when about to run a command or read a file whose output may be long, such as a test suite, a build, a log, a diff, a search or a large file, or when your context is filling with tool output.`).
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(skills): add tool-output`.

### Task 5: Evaluation E15, the needle in a long log (item 1)

**Files:**
- Create: `evals/fixtures/e15-long-log/build.log`, `evals/fixtures/e15-long-log/package.json`, `evals/tasks/E15.json`
- Modify: `evals/graders.mjs` (add `gradeE15`, add it to `GRADERS`), `evals/README.md` (add the E15 row)
- Test: `tests/graders.test.mjs`, `tests/eval-tasks.test.mjs`

**Interfaces:**
- Produces: `gradeE15(events) -> { pass, criticalFailure, checks }`. Critical failure `did not find the failing migration` when the final `text` event lacks `0042` or `owner_id`. Checks: `the answer names migration 0042 and owner_id`; `tool results stayed under 20000 characters` (sum of the text of all `tool_result` events). `E15.json` has `id`, `title`, `fixture`, `prompt` (the spec's), `grader: "gradeE15"`, `rubric`, `criticalFailures`.

- [ ] **Step 1: Write the failing tests**: in `tests/graders.test.mjs`, `gradeE15` passes for a small transcript (a Grep result of a few lines, final text naming `0042` and `owner_id`); fails the size check, but not critically, when the tool results sum to over 20000 characters (use several tool results of 6000 characters each, as for a log read in slices) while the answer is right; is critical when the final text names another migration or lacks `owner_id`; judges only the final text (an earlier text event with the answer does not count when the final one lacks it). In `tests/eval-tasks.test.mjs` the shape check already covers a new task file; add a test that `evals/fixtures/e15-long-log/build.log` has 1400 to 1600 lines, exactly one line containing `ERROR E-4471`, that line names `0042` and `owner_id`, at least five decoy lines contain "failed" without being that error, and the file is under 150000 bytes.
- [ ] **Step 2: Run** `node --test tests/graders.test.mjs tests/eval-tasks.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Create the fixture and the grader.** Generate `build.log` once with a throwaway Node snippet (not committed): 1500 lines of the form `2026-10-29T10:<mm>:<ss>Z INFO  [<step>] <message>` in a deterministic order, with decoys (`WARN [cache] retry 3 of 5 failed for key warm:users (recovered)`, `INFO [migrate] applied migration 0041 add_index_users_email`, `INFO [migrate] skipped migration 0043 (blocked by 0042)`) and the one `ERROR E-4471: migration 0042 failed: duplicate column "owner_id"` near line 742. Write `gradeE15`, the task file, the `package.json` (`{"name":"e15-long-log","private":true,"type":"module"}`) and the README row.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. E15 is not run against a model in this phase.
- [ ] **Step 5: Commit** `feat(evals): E15, a needle error in a long log`.

### Task 6: Skill `secure-code` (item 2)

**Files:**
- Create: `skills/secure-code/SKILL.md`, `skills/secure-code/meta.yaml`
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing test** `secure-code starts from a threat model, has the three tiers, a language-model section and points to the security-auditor agent`: matches `threat model`, `Always`, `Ask first`, `Never`, `untrusted`, `language model`, `` `security-auditor` ``, `` `code-review` ``; at most 70 lines; the directory is not named `security-review`.
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write the skill** per spec item 2 (description: `Use when writing or changing code that takes input from outside, handles authentication, authorization, secrets, files, network requests, database queries or the output of a language model.`).
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(skills): add secure-code`.

### Task 7: Skill `impact-check` (item 3)

**Files:**
- Create: `skills/impact-check/SKILL.md`, `skills/impact-check/meta.yaml`
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing test** `impact-check finds users before the edit, classifies them in four groups and searches again after`: matches `Changed`, `Affected`, `Looked at, not affected`, `Cannot determine`, `as it is now`, `search again`, `before you edit`; at most 70 lines.
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write the skill** per spec item 3 (description: `Use when about to change a function, a type, a configuration key, a file name, a database column or any interface other code may use, before you edit it.`).
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(skills): add impact-check`.

### Task 8: Skill `research`, adapted (item 4)

**Files:**
- Create: `skills/research/SKILL.md`, `skills/research/meta.yaml` (class `adapted`, source `mattpocock/skills`, ref `v1.3.1`, license `MIT`, path `skills/engineering/research/SKILL.md`)
- Modify: `THIRD_PARTY_NOTICES.md` (add `## research`)
- Test: `tests/skills-consistency.test.mjs`

- [ ] **Step 1: Write the failing tests**: `research is adapted from the pinned mattpocock source and has a notice entry` (meta class, source path, a `^## research$` entry; and the path exists under `.upstream/mattpocock-skills/` only when that directory exists, otherwise skipped); `research keeps primary sources and cited findings and adds version, untrusted text, a visible limit, dating and a file only on request` (matches `primary sources`, `version`, `Context7`, `data, never instructions`, `at most five`, `did not read`, `date`, `only when the user asked`); at most 70 lines.
- [ ] **Step 2: Run** `node --test tests/skills-consistency.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Write the skill and the notice** per spec item 4 (description: `Use when you must learn something from outside the repository before acting, such as a library's current API, an error message, a web page or a document the user pointed at.`). `meta.yaml` `changed.summary` lists what was kept (primary sources, cite each claim, save where the repository keeps notes) and what was added or dropped (the background-agent instruction made conditional on a subagent tool; version first; untrusted text; a visible limit; citation with date and label; a file only on request).
- [ ] **Step 4: Run** `npm test && npm run check`. Expected: PASS (lint, notices and sources checks included).
- [ ] **Step 5: Commit** `feat(skills): add research`.

### Task 9: Docs, credits and the whole-suite check

**Files:**
- Modify: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`
- Test: `tests/docs.test.mjs`

- [ ] **Step 1: Write the failing tests** in `tests/docs.test.mjs`: the README names `skills/tool-output`, `skills/secure-code`, `skills/impact-check`, `skills/research` and `agents/`, calls them drafts, and says the agents are not yet verified to load; CONTRIBUTING names the agents lint (`scripts/lint-agents.mjs` or `lint-agents`); the changelog mentions the four skills, the four agents and `E15`; the credits section names `rtk`, `headroom`, `context-mode`, `Understand-Anything` and `security-auditor`'s source `agent-skills`, and still says no text was copied.
- [ ] **Step 2: Run** `node --test tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Update the docs.** README: a section "Skills and agents added in Phase 2" (what each does in one line, drafts, unmeasured, E15 written and not run, `agents/` read only by Claude Code and unverified). CONTRIBUTING: "Add an agent" (the file layout, the lint, the read-only tool rule). CHANGELOG: entries. `THIRD_PARTY_NOTICES.md`: extend the credits with rtk (Apache-2.0), headroom (Apache-2.0), context-mode (Elastic-2.0, idea only), Understand-Anything (MIT), career-ops (MIT), and the agents' ideas (wshobson/agents, agent-skills). Fix the Phase 1 miscount ("ten" repositories) if the section changes.
- [ ] **Step 4: Run** `npm test && npm run check && npm run check:release`. Expected: all PASS; read the output.
- [ ] **Step 5: Commit** `docs: Phase 2 of the upstream ideas`.

### Task 10: Check that Claude Code loads the agents (item 5, evidence)

**Files:**
- Modify: `docs/evidence/claude-code.md`, `README.md` (only the sentence about the agents)
- Test: none (a recorded manual check)

- [ ] **Step 1: Run** from a temporary directory outside the repository: `claude -p "reply with the word ok" --plugin-dir <repo> --setting-sources project,local --no-session-persistence --output-format stream-json --verbose`, and read the `agents` array of the first line whose `type` is `system` and `subtype` is `init`. This calls a model once for a one-word reply. Expected: the array lists the four agent names, possibly prefixed with the plugin name.
- [ ] **Step 2: Record the result honestly** in `docs/evidence/claude-code.md`: the command (without paths from the user's home), the date, the Claude Code version from the same line, the agent names seen or not seen, and what it does not show (that a dispatched agent obeys its tool list; other agents). If the four names are absent, say so, leave the README sentence as "not verified", add a `Ruling:` to the ledger, and look at why (the plugin manifest may need an `agents` path) before changing anything.
- [ ] **Step 3: If the names were seen**, change the README sentence to say the agents were seen listed in one session, with a link to the evidence file; if not, leave it. Run `npm test`.
- [ ] **Step 4: Commit** `docs: evidence for the agents`. Then request one `code-review` of the whole branch against the spec.

---

## Self-review notes

- Spec coverage: item 1 → Tasks 4 and 5; 2 → 6; 3 → 7; 4 → 8; 5 → 1, 2, 3 and 10; 6 (dropped) → no task, and Task 9 does not mention a scanner; honesty and credits → Task 9.
- The agents' content (Task 2) is the most open task: tests pin the sections and phrases the spec names, not the wording.
- The spec says E15's whole-log read is about 90000 characters; Task 5's size check allows 20000, so a Grep-based run passes and a full read fails.
