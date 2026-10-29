# 14All

## What this is

A plugin of skills, hooks, read-only role agents and evaluations that make AI coding agents more reliable. Pre-release (0.1.0). Claude Code and Codex have been verified (`docs/evidence/claude-code.md`, `docs/evidence/codex.md`); support for another agent needs a file under `docs/evidence/`.

## Commands

- Test: `npm test` (Node 22 or newer)
- Check (lint skills and agents, text, paths, routing, notices, manifests, sources, secrets): `npm run check`
- Release check: `npm run check:release`
- New skill: `npm run new-skill -- <name>`
- Audit any repository for agent-readiness: `npm run check:harness -- <dir>`
- Evaluations call a model and never run in CI: `node evals/run.mjs <task> --mode baseline|14all --runs 3`, then `npm run eval:report -- <date>` and `npm run eval:compare -- <date>`

## Layout

- `skills/<name>/`: `SKILL.md` and `meta.yaml`; detail in `references/`, read on demand.
- `agents/`: read-only role agents. `hooks/`: `session-start` (bootstrap and resume block), `guard` (PreToolUse), `run-hook.cmd`.
- `scripts/`: the checks behind `npm run check`. `evals/`: tasks, fixtures, graders and saved run summaries.
- `docs/specs`, `docs/plans`: designs and plans. `docs/evidence`: what was run and what it shows.
- `upstream/sources.json`: pinned third-party sources. `.upstream/` is a local clone and is ignored.

## Conventions

- Hooks use shell built-ins only (no `cat`, `grep`, `jq`), run under bash 3.2, print JSON, and never block on their own error.
- A skill has only `name` and `description` in its frontmatter and stays under 400 lines. The description starts "Use when" and names the situation. The `writing-for-agents` skill says how.
- Write skill text as actions, not as the names of tools.
- A skill adapted from another project has its source pinned in `upstream/sources.json`, an entry in `THIRD_PARTY_NOTICES.md` and a `changed` note in `meta.yaml`. Text from a source whose license does not allow it is not copied.
- A new skill starts at `maturity: draft` and is called unmeasured until an evaluation says otherwise.
- Say what was verified and what was not.

## Verify before you say done

Run `npm test`, `npm run check` and `npm run check:release`, and read their output. The exit status matters, so do not pipe them through `tail`. Say which of them you ran.

## Do not touch

- `evals/runs/*/raw/` holds local paths: do not commit it.
- `evals/runs/<date>/*.json` are saved summaries: regenerate them with `node evals/regrade.mjs <date>`; do not edit them by hand.
- `.upstream/` and `node_modules/` are local and ignored.

## Where more is written

- `CONTRIBUTING.md`: how to add a skill, a role agent, an agent adapter or an evaluation.
- `docs/specs/2026-10-28-14all-design.md`: the first design. The later specs in `docs/specs/` extend it.
- `SECURITY.md` and `THIRD_PARTY_NOTICES.md`.

## Notes for the next session

Progress notes and handoffs go in `.14all/progress/` and `.14all/handoff/`, which git ignores.
