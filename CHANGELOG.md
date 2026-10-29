# Changelog

Notable changes to 14All. The format follows [Keep a Changelog](https://keepachangelog.com/); versions follow semver.

## Unreleased

## 0.1.0 - 2026-10-29

First public pre-release. Only Claude Code has been tried.

### Added

- `simple-code` skill with 25 references (14 languages, 11 frameworks): learn the project's conventions, follow written rules, keep new code simple. Draft and unmeasured.
- `executing-plans` skill: inline execution of a plan with a progress file and rulings.
- `hooks/guard`, a PreToolUse hook that denies recursive removes of `/` or `~`, force pushes to main or master, download-into-shell pipes, writes to raw disks, and reads of secret files. Switch off with `ALL14_GUARD=off`.
- `npm run new-skill`, `npm run eval:report`, `npm run check:release` and `npm run check:drift`.
- `CONTRIBUTING.md`, `SECURITY.md` and this changelog.
- Secret scan patterns for Anthropic, OpenAI, Slack and Google keys.
- Lint: an unquoted skill description containing ` #` is an error; `maturity: tested` or `verified` requires an `evidence` path in `meta.yaml`.
- CI runs on Linux and macOS and shellchecks the guard and the wrapper.
- Guard: also denies `git push --force-with-lease` to main or master, a force push with no branch named while on main or master, `bash <(curl ...)` and `sh -c "$(curl ...)"` style runs, secret reads through `cat`, `grep`, `tail` and similar, and the Grep tool aimed at a secrets file.

- `handoff` skill (adapted from mattpocock/skills): a note for a fresh agent with what is verified, what is broken, what was tried, and the next steps. Draft.
- `working-notes` skill: a notes file in `.14all/progress/` for a long task without a written plan. Draft.
- A resume block in the session-start hook: the newest `.14all/progress/*.md`, at most 3000 characters, framed as data. `ALL14_RESUME=off` leaves it out.
- Guard: denies `--no-verify` (commit, push, merge, am, cherry-pick), `git commit -n` and a `core.hooksPath` override; asks the user before an existing lint or format configuration is edited (`Edit`, `Write` and `MultiEdit` are now matched). The prompt is not yet verified in a live session.
- Evals: a run's grade can be `inconclusive` (a test run cut off before its summary) and the report counts those apart; a run must show the bootstrap in 14all mode and not in baseline mode or it is invalid; `npm run eval:compare` gates saved runs (dropped task, more critical failures, fewer passes; no significance test).
- `THIRD_PARTY_NOTICES.md` credits the ideas taken from other repositories (no text copied).
- Skills `tool-output`, `secure-code`, `impact-check` and `research` (adapted from mattpocock/skills). Drafts.
- `agents/`: read-only role agents `debugger`, `reviewer`, `preship-reviewer` and `security-auditor`, with `scripts/lint-agents.mjs` in `npm run check`. Seen listed in one live Claude Code session; that an agent keeps to its read-only tool list is not verified.
- Evaluation E15: one error in a long log, with a grader and a fixture; not yet run.

- `writing-for-agents` skill (adapted from mattpocock/skills) with an `AGENTS.md` template. Draft.
- `skills/simple-code/references/web-ui.md`: a web UI reference with a priority order of checks and a render-and-look loop. Draft.
- A Definition of done in `verification-before-completion` and an "If the change reaches users" section in `finishing-a-development-branch`.
- `scripts/check-text.mjs`, `scripts/check-paths.mjs` and `scripts/check-routing.mjs` (with `evals/routing/cases.json`, three known gaps) in `npm run check`, and `npm run check:harness`, an eight-check audit of any repository.
- `AGENTS.md` and `CLAUDE.md` for this repository.

### Changed

- The package and plugin descriptions no longer say "cross-agent" or promise more reliability: they say it is an early release tried with Claude Code only. The planning documents in `docs/plans/` are marked as a historical record.
- The marketplace install (`/plugin marketplace add`, `/plugin install`) was run once in a clean configuration and worked; see `docs/evidence/claude-code.md`.
- The `OWNER` placeholder is replaced by `LILLINH` in the manifests, `LICENSE`, every skill's `meta.yaml`, the README and SECURITY.md; the repository URL is `https://github.com/LILLINH/14All`. `npm run check:release` passes.
- Guard: text inside quotes or a here-document no longer triggers a denial (a commit message that mentions `rm -rf /` was blocked); a quoted argument to `sh -c`, `bash -c` or `eval` and anything inside `$(...)` is still checked. Public SSH keys, `~/.ssh/config` and `known_hosts` are no longer treated as secrets. A command over 2000 characters is scanned at its start and its end only (a long here-document body is skipped), which keeps the hook inside its timeout on macOS bash 3.2.
- CI runs on pushes to `main` and on pull requests only, and cancels a superseded run on the same ref.
- The evaluation runner records `invalid` for a run in which the agent never ran (bad exit status, empty transcript, no result message); reports leave those out of every count.
- Grader E1 needs the question to end a line. Grader E4 lets the last of "claims done" and "not verified" decide, and a read-only command (`ls`, `cat`) no longer counts as verification. The 24 saved runs regrade to the same outcomes.
- `simple-code`: a never-trade list (boundary validation, data-protecting error handling, security, accessibility) and a rule to look for an existing helper before writing one.
- `code-review`: no concrete case, no finding; evidence labels (`read`, `inferred`, `unverified`); the reviewer gets no conclusion and "none provided" for a missing input; a Reinvented Wheel smell.
- `systematic-debugging` and `code-review` name the role agents to use for competing hypotheses and for a dedicated review.
- `executing-plans` records a plan hash and rechecks it on resume; subagent briefs ask for the line range actually read.
- The session-start hook injects the bootstrap skill body without its YAML frontmatter.
- `bumpVersion` reads and checks every listed file before writing any.
- README install commands are `/plugin marketplace add` and `/plugin install 14all@14all`.
- Specs and plans moved from `docs/superpowers/` to `docs/specs/` and `docs/plans/`, where the skills tell agents to save them.
- CI actions are pinned to commit SHAs.

### Fixed

- Guard: a tab between words (`rm<TAB>-rf<TAB>/`) is now read as a separator, so it is no longer missed.
- Guard: the JSON input is read with plain string operations on a window of at most 2000 characters, never a regular expression or a global substitution over the whole input. On a 38 KB command with thousands of escaped quotes those took 35 s and more in the bash 3.2 that macOS ships, far past the hook's 5 s timeout.

- `scan-secrets` no longer crashes on a tracked file that was deleted from the working tree and not yet committed.
- Eval runs delete their temporary working copy when they finish.

## 0.1.0 (in development)

First pre-release: the bootstrap skill, 11 further skills, the Claude Code session-start hook, evaluation tasks E1 to E4, and the checks that keep skills, notices and upstream pins consistent.
