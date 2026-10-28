# Evidence: Plan 1 acceptance

Date: 2026-10-28. Claude Code 2.1.312. Model reported by the CLI for every run: claude-sonnet-5-5. Node 22.19.0, Linux. Commit measured: `037c1ec`.

## 1. Repository checks (clean clone)

Run from a fresh `git clone` of the repository, outside the working tree:

```
npm ci
npm test         # 115 tests, 115 pass, 0 fail
npm run check    # lint-skills, check-notices, check-manifests, check-sources, scan-secrets: exit 0
```

Not run: `shellcheck` (not installed on this machine; the CI workflow runs it, but the workflow has never run because the repository is not published). Windows (`hooks/run-hook.cmd` Windows branch) has never been run.

## 2. Baseline versus 14All, tasks E1 to E4

Command, per task and mode: `node evals/run.mjs <task> --mode baseline|14all --runs 3`. Both modes use `--setting-sources project,local`, so the user's own plugins are not loaded in either; the only difference is `--plugin-dir <repo>` in 14all mode. Tools were limited to file tools plus `npm test`, `node`, `ls` and `cat`. 3 runs per task per mode, 24 runs, total model cost reported by the CLI: $1.549.

Grader results (deterministic checks only, see section 4 for what is not graded):

| Task | Mode | Runs passing | Critical failures | Avg cost | Avg turns |
|---|---|---|---|---|---|
| E1 ask before building | baseline | 0 of 3 | 3 (edited files before asking) | $0.075 | 8.0 |
| E1 ask before building | 14all | 3 of 3 | 0 | $0.064 | 5.0 |
| E2 root cause before fix | baseline | 2 of 3 | 0 | $0.052 | 6.0 |
| E2 root cause before fix | 14all | 3 of 3 | 0 | $0.077 | 7.3 |
| E3 test first | baseline | 0 of 3 | 3 (no test file written) | $0.048 | 5.3 |
| E3 test first | 14all | 3 of 3 | 0 | $0.078 | 10.0 |
| E4 verify before claiming done | baseline | 0 of 3 | 0 | $0.048 | 4.3 |
| E4 verify before claiming done | 14all | 3 of 3 | 0 | $0.074 | 9.0 |

Raw per-run summaries are in `evals/runs/2026-10-28/`. The raw transcripts are kept locally only (git-ignored, they hold local paths).

## 3. What the transcripts show

These are my readings of the saved transcripts, not rubric scores. Only the transcripts named here were read in full; the rest were judged by the graders alone.

- **E1.** Baseline run 1 read the code, picked an interpretation (a subscription API), wrote it, then ran the tests; the grader flagged all three baseline runs for editing before asking, and I read only run 1. In 14All runs 1 and 3 (the ones I read) the agent invoked a skill, described what the app is and what "notifications" could mean, and ended with questions without editing any file; run 2 passed the grader and was not read.
- **E2.** All three baseline runs (read) stated the root cause (the sort mutates its input). The one baseline run that did not pass edited the file before running the tests. The difference between the modes on this task is one run in three. The 14All E2 runs were not read.
- **E3.** All three 14All runs (read) invoked the test-driven-development skill, wrote a test file, ran it and saw it fail for a missing module, wrote the implementation, then ran it again and saw it pass. No baseline run wrote a test file (grader result; the baseline transcripts were not read).
- **E4.** In all three baseline runs (read) the agent rewrote the function, checked it with ad-hoc `node -e` commands, reported the work as done, and never ran the project's test suite. For the 14All runs the grader found an `npm test` run before the report; the transcripts were not read.
- **Cost.** 14All runs took more turns in E2, E3 and E4 (about 1 to 5 more) and cost about $0.02 to $0.03 more per run there; in E1 they took fewer turns because the run ends at the questions.

## 4. What this does not show

- **Rubric scores are not done.** The task files list rubric items (for example "questions are concrete", "the fix is minimal"). Scoring them needs a maintainer to read the transcripts. Only the deterministic checks above were applied.
- **Three runs per cell is a smoke-sized sample.** No statistical claim is made. E2 in particular (2 of 3 against 3 of 3) is within what three runs can produce by chance.
- **The graders were corrected after the runs, and the runs were regraded.** The E4 grader missed a case on a one-run smoke test (the report after an edit counts as a claim even without a completion keyword; critical failure now means no command at all before the claim). After the 24 runs, the E3 grader missed a failing run whose output had been cut by `| head -20`; two 14All runs were graded as failing the "a failing run came before a passing run" check when the transcripts show it. Both fixes were written test-first and applied to the saved transcripts with `node evals/regrade.mjs 2026-10-28`; the previous grade is kept in each summary under `previousGrade`. Exactly two outcomes changed (E3, 14all, runs 1 and 3, from fail to pass); every other run kept its grade. Beyond the transcripts named in section 3, no other transcript was read to check its grade. Because the grader was adjusted after seeing results, treat this table as a first read and re-run it with a fixed grader before using it as a release gate.
- **One agent and one model.** Nothing was run on Codex, Cursor, Gemini CLI or Antigravity.
- **Headless mode only.** There is no user to answer the questions in E1; ending at the questions is what the task rewards.
- **The tasks are small and written by the plugin's author.** They test whether the skills change behavior on those four situations, not whether the plugin helps on real projects.
- **Marketplace install is untested** (see `docs/evidence/claude-code.md`).

## 5. Open items for Plans 2 and 3

- Maintainer rubric scoring of the 24 transcripts.
- Re-run E1 to E4 with the corrected graders and more runs per cell.
- Replace workflow action tags with commit SHAs before release; run the CI workflow after the repository is published.
- Adapters for Codex, Cursor, Gemini CLI and Antigravity, each with an evidence file.
- Guardrail hooks, Context7 workflow, memory templates, subagent roles and evaluations E5 to E12.
- Replace the `OWNER` placeholder.
