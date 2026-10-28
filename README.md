# 14All

A curated, cross-agent toolkit of skills, hooks and workflows that makes AI coding agents (Claude Code, Codex, Cursor, Gemini CLI and others) more reliable.

**Status: pre-release (0.1.0 in development).** Support for an agent is claimed here only when an evidence file under `docs/evidence/` backs it.

## Support

| Agent | Status | Evidence |
|---|---|---|
| Claude Code | Session-start bootstrap verified with the plugin loaded for one session (`--plugin-dir`). Marketplace install not yet tested. | [docs/evidence/claude-code.md](docs/evidence/claude-code.md) |
| Codex CLI, Cursor, Gemini CLI, Antigravity, OpenCode | Not started. | none |

## Evaluation

On four small tasks (ask before building, root cause before fix, test first, verify before claiming done), Claude Code with the plugin loaded passed the deterministic grader in 12 of 12 runs; without it, 2 of 12. Three runs per cell, one model, deterministic graders only, rubric scoring not done, and the graders were corrected after the runs. Read the limits in [docs/evidence/plan-1-acceptance.md](docs/evidence/plan-1-acceptance.md) before relying on these numbers.

## Install (Claude Code, not yet tested)

Once the repository is published, the intended command is:

```
/plugin install 14all --marketplace OWNER/14all
```

`OWNER` is a placeholder until the repository exists.

## Design

`docs/superpowers/specs/2026-10-28-14all-design.md`
