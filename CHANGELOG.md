# Changelog

Notable changes to 14All. The format follows [Keep a Changelog](https://keepachangelog.com/); versions follow semver.

## Unreleased

### Added

- `executing-plans` skill: inline execution of a plan with a progress file and rulings.
- `hooks/guard`, a PreToolUse hook that denies recursive removes of `/` or `~`, force pushes to main or master, download-into-shell pipes, writes to raw disks, and reads of secret files. Switch off with `ALL14_GUARD=off`.
- `npm run new-skill`, `npm run eval:report`, `npm run check:release` and `npm run check:drift`.
- `CONTRIBUTING.md`, `SECURITY.md` and this changelog.
- Secret scan patterns for Anthropic, OpenAI, Slack and Google keys.
- Lint: an unquoted skill description containing ` #` is an error; `maturity: tested` or `verified` requires an `evidence` path in `meta.yaml`.
- CI runs on Linux and macOS and shellchecks the guard and the wrapper.
- Guard: also denies `git push --force-with-lease` to main or master, a force push with no branch named while on main or master, `bash <(curl ...)` and `sh -c "$(curl ...)"` style runs, secret reads through `cat`, `grep`, `tail` and similar, and the Grep tool aimed at a secrets file.

### Changed

- Guard: text inside quotes or a here-document no longer triggers a denial (a commit message that mentions `rm -rf /` was blocked); a quoted argument to `sh -c`, `bash -c` or `eval` and anything inside `$(...)` is still checked. Public SSH keys, `~/.ssh/config` and `known_hosts` are no longer treated as secrets. A command over 3000 characters is scanned at its start and its end only (a long here-document body is skipped), which keeps the hook inside its timeout on macOS bash 3.2.
- CI runs on pushes to `main` and on pull requests only, and cancels a superseded run on the same ref.
- The evaluation runner records `invalid` for a run in which the agent never ran (bad exit status, empty transcript, no result message); reports leave those out of every count.
- Grader E1 needs the question to end a line. Grader E4 lets the last of "claims done" and "not verified" decide, and a read-only command (`ls`, `cat`) no longer counts as verification. The 24 saved runs regrade to the same outcomes.
- The session-start hook injects the bootstrap skill body without its YAML frontmatter.
- `bumpVersion` reads and checks every listed file before writing any.
- README install commands are `/plugin marketplace add` and `/plugin install 14all@14all`.
- Specs and plans moved from `docs/superpowers/` to `docs/specs/` and `docs/plans/`, where the skills tell agents to save them.
- CI actions are pinned to commit SHAs.

### Fixed

- Guard: a tab between words (`rm<TAB>-rf<TAB>/`) is now read as a separator, so it is no longer missed.
- Guard: the JSON input is read with plain string operations and `LC_ALL=C` instead of a regular expression over the whole input. The regex took about 35 s for a 38 KB command in the bash 3.2 that macOS ships, past the hook's 5 s timeout.

- `scan-secrets` no longer crashes on a tracked file that was deleted from the working tree and not yet committed.
- Eval runs delete their temporary working copy when they finish.

## 0.1.0 (in development)

First pre-release: the bootstrap skill, 11 further skills, the Claude Code session-start hook, evaluation tasks E1 to E4, and the checks that keep skills, notices and upstream pins consistent.
