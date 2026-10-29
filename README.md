# 14All

A curated toolkit of skills, hooks and workflows that aims to make AI coding agents more reliable. It is built to work across agents, but only Claude Code is verified so far.

**Status: pre-release (0.1.0 in development).** Support for an agent is claimed here only when an evidence file under `docs/evidence/` backs it.

## Support

| Agent | Status | Evidence |
|---|---|---|
| Claude Code | Session-start bootstrap verified with the plugin loaded for one session (`--plugin-dir`). Marketplace install not yet tested. | [docs/evidence/claude-code.md](docs/evidence/claude-code.md) |
| Codex CLI, Cursor, Gemini CLI, Antigravity, OpenCode | Not started. | none |

## Guard hook

`hooks/guard` is a PreToolUse hook (Bash, Read, Grep, Edit, Write and MultiEdit calls) that denies a short list of commands that are almost never intended: a recursive `rm` of `/` or `~`, bypassing git hooks (`--no-verify`, `git commit -n`, `-c core.hooksPath=...`), a force push (including `--force-with-lease`, and a bare `git push -f` while on main or master) to main or master, running a downloaded script through a pipe, `<(...)` or `$(...)`, writing to a raw disk device, and reading `.env`, private SSH keys or AWS credentials with the Read tool, the Grep tool, or `cat`, `grep`, `tail` and similar. It also asks the user, instead of denying, before an existing lint or format configuration (`.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `biome.json`, `ruff.toml`, `.editorconfig` and similar) is edited; creating one is allowed. Text inside quotes or a here-document is ignored, so a commit message that mentions `rm -rf /` is not blocked; a quoted argument to `sh -c` or `eval` is still checked. It is a safety net against slips, not a security boundary: a differently spelled command gets past it. Set `ALL14_GUARD=off` to switch it off for a session. It is covered by unit tests; that the prompt for a config edit appears in a live session is not yet verified. A live Claude Code session was seen to deny one force push, with an earlier version of the hook that did not yet cover Grep or quote handling (one run, see [docs/evidence/claude-code.md](docs/evidence/claude-code.md)).

## Simple code

`skills/simple-code` makes the agent learn how the project it is in already writes code (written rules first, then habits), follow that for style, and keep the code it adds simple enough for a person to read and maintain, without cutting input validation at a boundary, error handling that protects data, security checks or accessibility. Guidance for 14 languages and 11 frameworks sits in `skills/simple-code/references/` and is read only for the files being touched. The skill is **unmeasured**: its evaluation tasks (E13 for React, E14 for Vue) exist, but no run has been made, and every reference says `Status: draft, not measured.`

## Handoff and working notes

`skills/handoff` writes a note a fresh agent can continue from, into a git-ignored `.14all/handoff/`. `skills/working-notes` keeps a notes file in `.14all/progress/` for a long task that has no written plan; the session-start hook adds the newest file there to the context at the start of a session, after `/clear` and after compaction (at most 3000 characters, framed as data, not instructions). Set `ALL14_RESUME=off` to leave it out. Both skills are drafts. The skills, the resume block and the guard's new rules are covered by unit tests and the lint only: no live session has shown them working, and no evaluation has measured them.

## Evaluation

On four small tasks (ask before building, root cause before fix, test first, verify before claiming done), Claude Code with the plugin loaded passed the deterministic grader in 12 of 12 runs; without it, 2 of 12. Three runs per cell, one model, deterministic graders only, rubric scoring not done, and the graders were corrected after the runs. Read the limits in [docs/evidence/plan-1-acceptance.md](docs/evidence/plan-1-acceptance.md) before relying on these numbers. `npm run eval:report -- <date>` rebuilds the table from the saved runs, with a column for runs whose evidence could not be read. `npm run eval:compare -- <date>` checks that the plugin mode is no worse than the baseline on those runs (a dropped task, more critical failures or fewer passes fail it; too few runs leave it undecided).

Contributing: [CONTRIBUTING.md](CONTRIBUTING.md). Security: [SECURITY.md](SECURITY.md). Changes: [CHANGELOG.md](CHANGELOG.md).

## Install (Claude Code, not yet tested)

The repository is published at https://github.com/LILLINH/14All. The commands are:

```
/plugin marketplace add LILLINH/14All
/plugin install 14all@14all
```

## Design

`docs/specs/2026-10-28-14all-design.md`
