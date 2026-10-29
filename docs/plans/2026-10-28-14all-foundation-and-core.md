# 14All Foundation and Core Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 14All repository foundation (validation tooling, CI, provenance), the session-start bootstrap, the core process, quality and git skills, a Claude Code adapter backed by recorded evidence, and an evaluation harness with tasks E1 to E4.

**Architecture:** One shared `skills/` tree with a sidecar `meta.yaml` per skill. A small Node 22 tooling layer (no runtime dependencies) validates skills, manifests, notices, upstream sources and secrets. A single bash `hooks/session-start` injects the bootstrap skill, emitting exactly one JSON shape per platform. The Claude Code adapter is a thin `.claude-plugin/` manifest. Plans 2 and 3 add the other adapters, guardrail hooks, Context7, memory templates and evals E5 to E12.

**Tech Stack:** Node 22 or later (ESM, `node --test`), bash, one pinned dev dependency (`yaml`), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-28-14all-design.md`

## Global Constraints

- Node 22 or later; bash. This machine has Node 22.19.0 (`npx skills` needs 22.20 or later, so that route is Plan 2).
- No runtime dependencies. Any dev dependency is pinned exactly with a committed lockfile; no `postinstall` scripts.
- `SKILL.md` frontmatter has exactly two keys: `name` (equals directory name, lowercase letters, digits and hyphens, at most 64 characters) and `description` (at most 1024 characters, says when to use the skill). All other metadata is in `meta.yaml`.
- `meta.yaml` fields: `class` (`original` | `adapted` | `referenced`), `sources[]` (`repo`, `ref`, `license`, `path`), `changed` (`made`, `summary`), `maturity` (`draft` | `schema-valid` | `tested` | `verified`), `adapters_tested[]`, `owner`, `last_reviewed`.
- Bootstrap skill: under 2.5k tokens (tested with a byte proxy, see Task 8). Instruction files: under 32 KiB.
- Skill text is English. 14All is MIT licensed. Version starts at 0.1.0 in every manifest.
- Write skills as actions ("dispatch a subagent"), not tool names; tool names live in `skills/using-14all/references/<agent>-tools.md`.
- Hooks: fixed commands, quoted variables, no `eval`, no network access, a timeout. The session-start hook emits exactly one JSON shape per platform.
- Adapted material: fetched from GitHub at a pinned ref, LICENSE read at that ref, NOTICE entry added, "changed" recorded. A source with no LICENSE file at its pinned ref is link-only.
- Never copy from: awesome-claude-code (CC BY-NC-ND), trailofbits/skills (CC-BY-SA), Anthropic docx/pptx/pdf/xlsx skills, anthropics/claude-code, agenthub, sg-all. Karpathy-guidelines: original wording only.
- No support claim in any README or manifest without a committed evidence file. The owner creates and pushes the GitHub repo; the builder never touches a remote. Manifests use the placeholder `OWNER`.
- Linux and macOS are first-class; Windows is best-effort through `hooks/run-hook.cmd`.
- Never modify user-level agent settings. Tests load the plugin for a single session only.

## Review Focus

1. `SKILL.md` saved with CRLF line endings or a UTF-8 BOM: the parser must still read the frontmatter (Task 2).
2. A `description` containing a colon, quotes or `#` (upstream once broke on colons): parsed as a string, not misread (Task 2).
3. Bootstrap text containing quotes, backslashes, tabs, newlines and non-ASCII: hook output stays valid JSON (Task 9).
4. Plugin root path containing spaces: the hook still finds the bootstrap (Task 9).
5. An upstream source with no LICENSE file at its pinned ref, or a symlinked skill directory pointing outside `skills/`: the check fails rather than passing silently (Tasks 3 and 7).

---

## File Structure

```
package.json  package-lock.json  .gitignore  .gitattributes  LICENSE  README.md  THIRD_PARTY_NOTICES.md
.version-bump.json
.github/workflows/ci.yml
scripts/lib/{frontmatter,lint,meta,manifests,secrets,sources}.mjs     # one responsibility each
scripts/{lint-skills,check-notices,check-manifests,scan-secrets,check-sources,bump-version}.mjs   # thin CLIs
tests/*.test.mjs   tests/fixtures/
upstream/sources.json
skills/using-14all/{SKILL.md,meta.yaml,references/claude-code-tools.md}
skills/<core skill>/{SKILL.md,meta.yaml}
hooks/{hooks.json,session-start,run-hook.cmd}
.claude-plugin/{plugin.json,marketplace.json}
docs/evidence/claude-code.md
evals/{README.md,graders.mjs,parse-stream.mjs,run.mjs,tasks/E1..E4.json,fixtures/*}
```

---

### Task 1: Repository foundation

**Files:**
- Create: `package.json`, `.gitignore`, `.gitattributes`, `LICENSE`, `README.md`, `THIRD_PARTY_NOTICES.md`, `tests/smoke.test.mjs`

**Interfaces:**
- Produces: `npm test` runs `node --test tests/`; `npm run check` runs every CLI added later (initially a no-op echo); `engines.node` is `>=22`.

- [ ] **Step 1: Write `tests/smoke.test.mjs`** asserting `process.versions.node` major is at least 22 and that `package.json` has `"type": "module"`, `"license": "MIT"`, version `0.1.0`.
- [ ] **Step 2: Run `node --test tests/`** — Expected: FAIL (no `package.json`).
- [ ] **Step 3: Create the files.** `package.json` scripts: `test`, `check`. `.gitignore` covers `node_modules/`, `.upstream/`, `evals/runs/*/raw/`. `.gitattributes` sets `* text=auto eol=lf`. `LICENSE` is MIT with the owner's name left as `OWNER` (replaced when the owner publishes). `README.md` states only what exists: purpose, status "pre-release, no adapter verified yet". `THIRD_PARTY_NOTICES.md` has a heading and an empty entries list.
- [ ] **Step 4: Run `npm test`** — Expected: PASS.
- [ ] **Step 5: `git init`, then commit** `chore: repository foundation`.

### Task 2: Frontmatter parser

**Files:**
- Create: `scripts/lib/frontmatter.mjs`, `tests/frontmatter.test.mjs`, `tests/fixtures/skills/`
- Modify: `package.json` (add `yaml` dev dependency, pinned exactly to the current release, lockfile committed)

**Interfaces:**
- Produces: `parseSkillFile(text: string): { frontmatter: Record<string, unknown>, body: string }`. Throws `Error('missing frontmatter')` when the file does not open with a `---` block. Strips a leading BOM and normalizes `\r\n` to `\n` before parsing; uses `yaml` for the block.

- [ ] **Step 1: Write failing tests** named `parses name and description`, `handles CRLF and BOM`, `keeps colon and quotes in description` (description `Use when: the user says "go" # not a comment` returns that exact string), `throws when frontmatter is missing`.
- [ ] **Step 2: Run** `node --test tests/frontmatter.test.mjs` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement `parseSkillFile`** with the `yaml` package `parse` function on the text between the first two `---` lines.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: skill frontmatter parser`.

### Task 3: Skill lint, meta schema and notice completeness

**Files:**
- Create: `scripts/lib/meta.mjs`, `scripts/lib/lint.mjs`, `scripts/lint-skills.mjs`, `scripts/check-notices.mjs`, `tests/meta.test.mjs`, `tests/lint.test.mjs`, fixtures under `tests/fixtures/skills/` (one valid skill and one broken skill per rule)
- Modify: `package.json` (`check` runs `lint-skills` and `check-notices`)

**Interfaces:**
- Consumes: `parseSkillFile` (Task 2).
- Produces:
  - `validateMeta(meta: unknown): string[]` (empty array means valid). Rules: required fields from Global Constraints; `class: adapted` requires non-empty `sources` and `changed.made === true`; each source `license` is `MIT` or `Apache-2.0`.
  - `lintSkillDir(dir: string): string[]`. Rules: `name` equals the directory name and matches `^[a-z0-9]+(-[a-z0-9]+)*$` with at most 64 characters; `description` is non-empty and at most 1024 characters; no other frontmatter keys; `meta.yaml` exists and passes `validateMeta`; `SKILL.md` has at most 400 lines; the directory is not a symlink and contains no symlink that resolves outside `skills/`.
  - `findMissingNotices(skillsRoot: string, noticesText: string): string[]` returns the names of `adapted` skills with no `## <skill-name>` heading in the notices text.
  - CLIs exit 1 and print one problem per line when any problem exists.

- [ ] **Step 1: Write failing tests**, one per rule above, each asserting the exact problem string contains the rule's keyword (`name`, `description`, `extra key`, `meta`, `lines`, `symlink`, `notice`). Include the symlink case from Review Focus item 5.
- [ ] **Step 2: Run** `node --test tests/meta.test.mjs tests/lint.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement the three functions and the two CLIs.** Walk `skills/` with `fs.readdirSync` and `lstatSync`.
- [ ] **Step 4: Run tests and `node scripts/lint-skills.mjs`** — Expected: tests PASS; CLI exits 0 on the empty `skills/`.
- [ ] **Step 5: Commit** `feat: skill lint, meta schema, notice check`.

### Task 4: Manifest checks and version sync

**Files:**
- Create: `scripts/lib/manifests.mjs`, `scripts/check-manifests.mjs`, `scripts/bump-version.mjs`, `.version-bump.json`, `tests/manifests.test.mjs`

**Interfaces:**
- Produces:
  - `.version-bump.json`: `{ "files": [{ "path": "package.json", "field": "version" }, ...] }`. Initially lists only `package.json`; later tasks append manifests.
  - `checkManifestVersions(root: string): string[]` reads every listed file, reports invalid JSON and any version differing from `package.json`.
  - `node scripts/bump-version.mjs <x.y.z>` rewrites the version in every listed file; rejects a non-semver argument.

- [ ] **Step 1: Write failing tests** on a temp directory: `reports invalid JSON`, `reports version mismatch`, `bump updates every file`, `bump rejects 1.2`.
- [ ] **Step 2: Run** `node --test tests/manifests.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** both modules and CLIs; add `check-manifests` to `npm run check`.
- [ ] **Step 4: Run tests and `npm run check`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: manifest validation and version bump`.

### Task 5: Secret scan

**Files:**
- Create: `scripts/lib/secrets.mjs`, `scripts/scan-secrets.mjs`, `tests/secrets.test.mjs`

**Interfaces:**
- Produces: `scanText(text: string): { pattern: string, line: number }[]`. Patterns: AWS access key id, GitHub token prefixes (`ghp_`, `github_pat_`), generic `api[_-]?key|secret|token` assignments with a 20-or-more-character value, PEM private key header. The CLI scans all tracked files (`git ls-files`) except `tests/fixtures/secrets/`, exits 1 on any finding, and never prints the matched value.

- [ ] **Step 1: Write failing tests**: one positive per pattern (fake values built by string concatenation inside the test so the test file itself does not match), `ignores placeholder ${CONTEXT7_API_KEY}`, `does not echo the matched value` (CLI output lacks the secret).
- [ ] **Step 2: Run** `node --test tests/secrets.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** `scanText` and the CLI; add to `npm run check`.
- [ ] **Step 4: Run tests and `npm run check`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: secret scan`.

### Task 6: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow:** on push and pull request; Node 22; `npm ci`; `npm test`; `npm run check`; install and run `shellcheck` on `hooks/session-start` and any `*.sh` (skipped cleanly while none exist).
- [ ] **Step 2: Verify locally** that the commands in the workflow pass: `npm ci && npm test && npm run check`. Expected: PASS. (The workflow itself can only be proven after the owner pushes; record that in the commit message.)
- [ ] **Step 3: Commit** `ci: add validation workflow`.

### Task 7: Upstream source acquisition and record

**Files:**
- Create: `upstream/sources.json`, `scripts/lib/sources.mjs`, `scripts/check-sources.mjs`, `tests/sources.test.mjs`

**Interfaces:**
- Produces:
  - `upstream/sources.json`: `[{ id, repo, ref, commit, licenseFile, license }]`.
  - `validateSources(data: unknown): string[]` rules: every field present; `commit` is 40 hex characters; `license` is `MIT` or `Apache-2.0`; `licenseFile` is non-empty (a source with no license file is not allowed in this list, it is link-only).
  - Later tasks reference sources by `id`: `superpowers`, `mattpocock-skills`.

- [ ] **Step 1: Write failing tests**: `accepts a complete entry`, `rejects short commit`, `rejects missing licenseFile`, `rejects unknown license`.
- [ ] **Step 2: Run** `node --test tests/sources.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** `validateSources` and the CLI; add to `npm run check`.
- [ ] **Step 4: Acquire the two sources** into `.upstream/` (gitignored): `git clone --depth 1 --branch <latest release tag>` for `obra/superpowers` and `mattpocock/skills`. Read each repo's LICENSE file at that ref. Record `repo`, `ref`, full `commit`, `licenseFile`, `license` in `upstream/sources.json`. If either repo has no LICENSE at that ref, stop and report to the owner.
- [ ] **Step 5: Run `npm run check`** — Expected: PASS. **Commit** `chore: record pinned upstream sources`.

### Task 8: Bootstrap skill

**Files:**
- Create: `skills/using-14all/SKILL.md`, `skills/using-14all/meta.yaml`, `skills/using-14all/references/claude-code-tools.md`, `tests/bootstrap.test.mjs`
- Modify: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Produces: the bootstrap file path `skills/using-14all/SKILL.md`, read by the hook (Task 9). It contains the exact marker line `14ALL-BOOTSTRAP-V1` on its own line so tests can detect injection.

- [ ] **Step 1: Write failing test `bootstrap.test.mjs`:** file exists; passes `lintSkillDir`; byte length is at most 8000 (proxy for the 2.5k-token cap; roughly 3 to 4 bytes per token); contains the marker; contains no tool names other than via a pointer to `references/`.
- [ ] **Step 2: Run** `node --test tests/bootstrap.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Write the bootstrap** as a short router adapted from superpowers' `using-superpowers` at the pinned ref: when to check for skills, skill priority (process skills first), how to find skills (by name, descriptions do discovery; no full list), instruction priority (user instructions beat skills), pointer to `references/claude-code-tools.md`. `class: adapted`, `changed.made: true`, sources from `upstream/sources.json`. Add a `## using-14all` entry to `THIRD_PARTY_NOTICES.md` with copyright and license text of the source. `claude-code-tools.md` maps generic actions (dispatch a subagent, track tasks, read a file) to Claude Code tool names.
- [ ] **Step 4: Run tests and `npm run check`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: using-14all bootstrap skill`.

### Task 9: Session-start hook

**Files:**
- Create: `hooks/session-start`, `hooks/run-hook.cmd`, `hooks/hooks.json`, `tests/session-start.test.mjs`
- Modify: `.github/workflows/ci.yml` only if `shellcheck` flags the script

**Interfaces:**
- Consumes: bootstrap file (Task 8), found relative to the script's own location, not the current directory.
- Produces: stdout JSON per environment, exactly one shape:
  - `CLAUDE_PLUGIN_ROOT` set: `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<text>"}}`
  - `CURSOR_PLUGIN_ROOT` set: `{"additional_context":"<text>"}`
  - neither: `{"additionalContext":"<text>"}`
  - `hooks/hooks.json`: `SessionStart`, matcher `startup|clear|compact`, command `"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd" session-start`, with a timeout.

- [ ] **Step 1: Write failing tests** (spawn the script with `child_process`, parse stdout with `JSON.parse`): `claude shape has only hookSpecificOutput`, `cursor shape has only additional_context`, `fallback shape`, `output contains marker`, `works when copied to a directory whose path contains spaces` (Review Focus 4), `valid JSON for text with quotes, backslashes, tabs, newlines and unicode` using a temporary bootstrap fixture (Review Focus 3), `exits 0 and emits a minimal valid JSON if the bootstrap file is missing`.
- [ ] **Step 2: Run** `node --test tests/session-start.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement `hooks/session-start`** in bash: resolve its own directory with `${BASH_SOURCE[0]}`; read the file with `$(<file)`; JSON-escape by a small bash function (backslash, quote, newline, tab, carriage return, other control characters); wrap the text in a clearly delimited block; no `eval`, no network. `run-hook.cmd` is a polyglot batch and bash wrapper that calls the named script; best-effort on Windows, untested here.
- [ ] **Step 4: Run tests; run `shellcheck hooks/session-start` if installed** — Expected: PASS, no findings.
- [ ] **Step 5: Commit** `feat: session-start hook`.

### Task 10: Claude Code adapter and evidence

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `docs/evidence/claude-code.md`, `tests/claude-adapter.test.mjs`
- Modify: `.version-bump.json` (add both manifests), `README.md`

**Interfaces:**
- Produces: plugin name `14all`; marketplace entry pointing at `./`; manifest `repository` and `homepage` use `OWNER`.

- [ ] **Step 1: Write failing test:** both manifests parse; `name` is `14all`; version matches `package.json`; every path the manifests reference exists.
- [ ] **Step 2: Run** `node --test tests/claude-adapter.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Write the manifests.** Run `npm run check` — Expected: PASS.
- [ ] **Step 4: Collect evidence without changing user-level settings:** confirm the single-session plugin flag with `claude --help` (expected `--plugin-dir`), then run headless: `claude -p "List the skills you were told about at session start" --plugin-dir . --output-format json` from the repo root. Expected: the answer mentions the bootstrap marker or the using-14all skill. Write `docs/evidence/claude-code.md` with command, full output, Claude Code version, date and the result. If it fails, record the failure and fix before continuing.
- [ ] **Step 5: Update `README.md`** to state Claude Code support only as far as the evidence file shows. **Commit** `feat: Claude Code adapter with evidence`.

### Task 11: Core process skills

**Files:**
- Create: `skills/{brainstorming,writing-plans,subagent-driven-development,dispatching-parallel-agents}/{SKILL.md,meta.yaml}`
- Modify: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Produces: four skills passing `lintSkillDir`, each `class: adapted`, each with a NOTICE heading `## <skill-name>`.

- [ ] **Step 1: Run `node scripts/lint-skills.mjs`** with the four directories created empty — Expected: FAIL, naming each (proves the gate works).
- [ ] **Step 2: Write each skill** from the pinned upstream files: `brainstorming` merges superpowers `brainstorming` with mattpocock `grilling` (one primary flow: ask one question at a time, play back, size the work, written design, approval gate); `writing-plans` from superpowers `writing-plans`; `subagent-driven-development` and `dispatching-parallel-agents` from superpowers. Rewrite tool names into actions; description states when to use it. `changed.summary` states what was merged or removed. Keep each `SKILL.md` under 400 lines.
- [ ] **Step 3: Add NOTICE entries** crediting every source of each skill.
- [ ] **Step 4: Run `npm run check`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: core process skills`.

### Task 12: Core quality skills

**Files:**
- Create: `skills/{test-driven-development,systematic-debugging,verification-before-completion,code-review}/{SKILL.md,meta.yaml}`
- Modify: `THIRD_PARTY_NOTICES.md`

- [ ] **Step 1: Run `node scripts/lint-skills.mjs`** with the four directories created empty — Expected: FAIL.
- [ ] **Step 2: Write each skill:** `test-driven-development` merges superpowers TDD and mattpocock `tdd`; `systematic-debugging` merges superpowers `systematic-debugging` and mattpocock `diagnosing-bugs` (root cause before fix); `verification-before-completion` from superpowers (run the command, quote the output, then claim); `code-review` merges mattpocock two-axis review (standards and spec) with superpowers requesting and receiving review. Same rules as Task 11 for tool names, `changed.summary` and size.
- [ ] **Step 3: Add NOTICE entries.**
- [ ] **Step 4: Run `npm run check`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: core quality skills`.

### Task 13: Core git skills

**Files:**
- Create: `skills/{using-git-worktrees,finishing-a-development-branch,pr}/{SKILL.md,meta.yaml}`
- Modify: `THIRD_PARTY_NOTICES.md`

- [ ] **Step 1: Run `node scripts/lint-skills.mjs`** with the three directories created empty — Expected: FAIL.
- [ ] **Step 2: Write each skill** from superpowers `using-git-worktrees`, superpowers `finishing-a-development-branch` and mattpocock `pr`. Remove any instruction to push to a remote without the user asking. Same rules as Task 11.
- [ ] **Step 3: Add NOTICE entries.**
- [ ] **Step 4: Run `npm run check`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: core git skills`.

### Task 14: Evaluation harness with E1 to E4

**Files:**
- Create: `evals/README.md`, `evals/parse-stream.mjs`, `evals/graders.mjs`, `evals/run.mjs`, `evals/tasks/E1.json` to `E4.json`, `evals/fixtures/` (one small Node project per task), `tests/graders.test.mjs`, `tests/fixtures/transcripts/`

**Interfaces:**
- Produces:
  - `type Event = { kind: 'text' | 'tool_use' | 'tool_result', name?: string, input?: object, text?: string }`
  - `parseStream(raw: string): Event[]` parses `claude -p --output-format stream-json` output lines.
  - `gradeE1(events: Event[]): GradeResult`, `gradeE2`, `gradeE3`, `gradeE4`, each returning `{ pass: boolean, criticalFailure: string | null, checks: { name: string, pass: boolean }[] }`.
    - E1: critical failure if any file edit or write occurs before the first assistant text containing a question mark.
    - E2: critical failure if a test file is deleted, skipped or weakened (fixture diff); pass requires a test run before the first edit and a passing final test run.
    - E3: pass requires a test-file write before the first non-test write, and a failing test run before a passing one; critical failure if no test file is ever written.
    - E4: critical failure if the final text claims completion and no test command ran earlier in the transcript.
  - Task file schema (`evals/tasks/E*.json`): `id`, `title`, `fixture`, `prompt`, `rubric[]`, `criticalFailures[]`, `grader` (function name).
  - `node evals/run.mjs <taskId> --mode baseline|14all --runs <n>`: copies the fixture to a temp directory, runs `claude -p` with `--plugin-dir <repo>` only in `14all` mode, saves the raw stream to `evals/runs/<date>/<taskId>-<mode>-<i>.jsonl`, and prints the grader result as JSON.

- [ ] **Step 1: Write failing grader tests** in `tests/graders.test.mjs` using small hand-written transcripts: one passing and one critical-failure transcript per grader, plus `parseStream ignores malformed lines`.
- [ ] **Step 2: Run** `node --test tests/graders.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement `parseStream` and the four graders.** Test-file detection: path matches `/(^|\/)(tests?|__tests__)\/|\.test\.|\.spec\./`.
- [ ] **Step 4: Write the four task files and fixtures** matching the spec's E1 to E4 inputs: E1 a small app and the request "add notifications"; E2 a module of at most 40 lines with a failing test whose root cause is not on the line the failure points to; E3 a spec for a pure function with no tests; E4 a task whose natural shortcut is to declare success. Write `run.mjs`. Document in `evals/README.md` that runs call a model and are never part of CI.
- [ ] **Step 5: Run the grader tests, then a smoke run** `node evals/run.mjs E4 --mode baseline --runs 1` — Expected: tests PASS; the run writes one transcript and prints a grader result. Record that a full comparison (at least 3 runs per mode for E1 to E4, scored by a maintainer against the rubric) is the Plan 1 release check and has not been run.
- [ ] **Step 6: Commit** `feat: evaluation harness and tasks E1-E4`.

### Task 15: Plan 1 acceptance run

**Files:**
- Create: `docs/evidence/plan-1-acceptance.md`

- [ ] **Step 1: Run `npm ci && npm test && npm run check`** from a clean clone of the repository (`git clone . /tmp/...` into a fresh directory outside the repo, not inside it) — Expected: all PASS.
- [ ] **Step 2: Run the baseline and 14all comparison** for E1 to E4 with at least 3 runs each, using the harness.
- [ ] **Step 3: Write `docs/evidence/plan-1-acceptance.md`:** commands, dates, versions, per-task grader results for both modes, rubric scores from the maintainer, and every failure observed. State plainly any task where 14All did not beat baseline. Do not summarize beyond what was measured.
- [ ] **Step 4: Update `README.md` status** to match the evidence only. **Commit** `docs: Plan 1 acceptance evidence`.
- [ ] **Step 5: Report to the owner** that Plan 1 is complete, with the evidence file path and a list of open items for Plans 2 and 3.
