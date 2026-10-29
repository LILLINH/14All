# Contributing

14All is a small, curated set of skills and hooks. A change is welcome when it makes an agent measurably more reliable and keeps the license trail intact.

## Set up

```
npm ci
npm test          # the unit tests
npm run check     # lint skills, notices, manifests, upstream pins, secret scan
```

Node 22 or newer. Both must pass before a pull request. CI runs them on Linux and macOS.

## Add a skill

```
npm run new-skill -- my-skill
```

This creates `skills/my-skill/SKILL.md` and `meta.yaml` that already pass the lint. Then:

1. Write the `description` as the trigger: "Use when ..." followed by the situation, not a summary of the steps. The agent decides from this line alone whether to load the skill.
2. Write the body as actions the agent can follow. Name actions ("dispatch a subagent"), not tool names; the tool map lives in `skills/using-14all/references/`. Stay under 400 lines.
3. Fill in `meta.yaml`. A skill that comes from elsewhere is `class: adapted`: list each source with its pinned ref and license, set `changed.made: true` with a summary, and add a `## my-skill` entry to `THIRD_PARTY_NOTICES.md`. The source must be in `upstream/sources.json` at a commit that has a LICENSE file.
4. Do not let two skills fire on the same trigger and say different things. `tests/skills-consistency.test.mjs` is where cross-skill rules are checked.
5. Start at `maturity: draft`. `tested` or `verified` needs an `evidence:` path to a file under `docs/evidence/` that shows what was run and what it does not show.

## Add an agent (Codex, Cursor, Gemini CLI, ...)

An agent is supported only when `docs/evidence/<agent>.md` shows it installed and loading the bootstrap in a real session. The README must not claim more than that file does. An adapter is:

- the agent's manifest next to `.claude-plugin/` (its own plugin format);
- a hook entry that runs `hooks/run-hook.cmd session-start` where the agent has session hooks (the script already prints the Cursor and fallback shapes), or the agent's instruction file pointing at the bootstrap where it has none;
- `skills/using-14all/references/<agent>-tools.md`, mapping the actions skills name to that agent's tools;
- the evidence file.

## Evaluations

`node evals/run.mjs <task> --mode baseline|14all --runs <n>` runs a task against Claude Code and grades the transcript; it calls a model and is never part of CI. `npm run eval:report -- <date>` prints the table. Fix a grader test-first, then `node evals/regrade.mjs <date>` to regrade saved runs; the old grade stays in `previousGrade`. A run with `invalid` set never ran the agent and is left out of the table.

## Hooks

`hooks/session-start` and `hooks/guard` use only shell built-ins (no `cat`, `grep`, `jq`), print JSON, never block on an error, and are covered by `tests/session-start.test.mjs` and `tests/guard.test.mjs`. The guard's deny list is deliberately short: add a pattern only for something almost never intended, with a test for what it blocks and one for the near miss it must allow.

## Before a release

`npm run check:release` fails while an `OWNER` placeholder is left in the manifests, skill metadata or README. `npm run check:drift` lists upstream releases newer than the pins. Bump the version with `node scripts/bump-version.mjs x.y.z` and move the Unreleased changelog entries under it.

## Commits

Small commits with a one-line reason. Do not commit anything from `evals/runs/*/raw/`; it holds local paths.
