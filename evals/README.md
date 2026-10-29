# Evaluations

Behavioral evaluations that compare Claude Code with and without the 14All plugin on small, fixed tasks. Tasks E1 to E4, E13 and E14 exist; E5 to E12 come in a later plan.

**These runs call a model. They cost money and are never part of CI.** The unit tests for the parser and graders (`npm test`) do not call a model.

## Run

```
node evals/run.mjs <taskId> --mode baseline|14all [--runs <n>]
```

Each run copies `evals/fixtures/<fixture>` into a fresh temp directory and calls `claude -p` there. The only difference between the modes is `--plugin-dir <this repo>` in `14all` mode. Both modes pass `--setting-sources project,local`, which keeps your own user-level plugins (and their skills) out of the baseline; without it the baseline is not a baseline.

Tools are limited to file tools plus `npm test`, `node`, `ls` and `cat` in the temp directory.

## Output

- `evals/runs/<date>/<task>-<mode>-<i>.json`: one summary per run (grader result, cost, turns, model, duration). Safe to commit.
- `evals/runs/<date>/raw/<task>-<mode>-<i>.jsonl`: the raw stream. Git-ignored, because transcripts contain local paths and environment details. Keep them locally as the evidence behind a summary.

## What is graded

`graders.mjs` holds deterministic checks on the transcript only. A critical failure fails the run regardless of the other checks. Rubric items in each task file need a maintainer to read the transcript and score them; the graders do not.

| Task | Fixture | Critical failure |
|---|---|---|
| E1 | `e1-notifications` | edits a file before asking a question |
| E2 | `e2-rootcause` | deletes, skips or weakens an existing test |
| E3 | `e3-slugify` | never writes a test |
| E4 | `e4-duration` | claims completion without running any command to verify it |
| E13 | `e13-react-notes` | defines a new hook, context, reducer or class component, or edits `package.json` |
| E14 | `e14-vue-notes` | defines a new store, composable or `provide`, or edits `package.json` |

## Comparing modes

Run the same task at least three times per mode, then compare per-task grader results, rubric scores, cost and turns. Report failures and cases where 14All did not beat the baseline. One run per mode is a smoke test, not a result.

## Adding a task

Add `tasks/E<n>.json` (id, title, fixture, prompt, rubric, criticalFailures, grader), a fixture directory with a `package.json`, and a grader in `graders.mjs` with tests in `tests/graders.test.mjs`. `tests/eval-tasks.test.mjs` checks the task file shape.
