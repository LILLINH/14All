# Evidence: Plan 1 acceptance

Date: 2026-10-28. Claude Code 2.1.312. Model reported by the CLI for every run: claude-sonnet-5-5. Node 22.19.0, Linux. The 24 evaluation runs were made with the harness at commit `a91f042` and regraded as described in section 4. Repository checks were repeated at commit `640649c` after the final review fixes.

## 1. Repository checks (clean clone of `640649c`)

Run from a fresh `git clone` of the repository, outside the working tree:

```
npm ci
npm test         # 132 tests, 132 pass, 0 fail
npm run check    # lint-skills (with the sources cross-check), check-notices, check-manifests, check-sources, scan-secrets: exit 0
```

In the working copy only (it needs the `.upstream/` checkouts, which are git-ignored): `npm run check:upstream` confirms that each of the three pinned upstream commits (obra/superpowers v7.0.1, mattpocock/skills v1.3.1, humanlayer/skills 653b641) has its LICENSE file. Exit 0.

A fresh reviewer on the most capable model read the whole change and returned "ready to merge with fixes": no Critical findings and five Important ones (a license attribution error in the `pr` skill, a missing check that skill sources are pinned, a hook failure under an empty PATH, two skills that gave opposite advice, and subagent events counted in grades). All five were fixed test-first in `640649c`. The ledger of decisions and deferred minor findings is not committed; the deferred items are listed in section 5.

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
- **The graders are lenient in ways that were not tightened.** E1 counts any assistant text containing a question mark as asking. E4's critical failure is cleared by any Bash command, even `ls`; the separate check "ran the test suite" is what separates the modes. Edits made through Bash (for example `cat > file`) are not seen by the graders, and the evaluation allows `Bash(node:*)`, which can run arbitrary code inside the temporary directory. I checked tool-call sequences (not message text) for 12 more runs (E1 baseline 2 and 3, E1 14all 2, E2 14all 1 to 3, E3 baseline 1 to 3, E4 14all 1 to 3), and none of the table's results depends on these gaps; no run contained a subagent event. That is a check of these 24 runs, not a guarantee for future ones.
- **One agent and one model.** Nothing was run on Codex, Cursor, Gemini CLI or Antigravity.
- **Headless mode only.** There is no user to answer the questions in E1; ending at the questions is what the task rewards.
- **The tasks are small and written by the plugin's author.** They test whether the skills change behavior on those four situations, not whether the plugin helps on real projects.
- **Marketplace install is untested** (see `docs/evidence/claude-code.md`).

## 5. Open items for Plans 2 and 3

Deferred minor findings from the final review (not fixed in Plan 1):

- A `#` in an unquoted description silently truncates it and still lints clean; add a lint error.
- The test-driven-development skill says to confirm seams with the user, which subagent implementers cannot do; tell them to record the seam choice in their report.
- README install line and the "cross-agent toolkit ... more reliable" wording run ahead of the evidence (only Claude Code is evidenced).
- E3 `SPEC.md` says "default-named export", which is ambiguous.
- Lint skips dot-directories under `skills/`; `bumpVersion` can leave files half-bumped; the secret scan lacks `sk-ant-`, `sk-`, Slack and Google key patterns; `maturity: tested` is accepted without an evidence link; skill files carry no in-file attribution (it matters when Plan 2 installs through `npx skills`, which copies only the skill directory).

Remaining work:

- Maintainer rubric scoring of the 24 transcripts.
- Re-run E1 to E4 with the corrected graders and more runs per cell.
- Replace workflow action tags with commit SHAs before release; run the CI workflow after the repository is published.
- Adapters for Codex, Cursor, Gemini CLI and Antigravity, each with an evidence file.
- Guardrail hooks, Context7 workflow, memory templates, subagent roles and evaluations E5 to E12.
- Replace the `OWNER` placeholder.

## 6. After Plan 1: what was addressed

Addressed after this acceptance run (see `CHANGELOG.md`, Unreleased): runs in which the agent never ran are marked `invalid` and left out of reports; the E1 and E4 graders were tightened (the 24 saved runs regrade to the same outcomes); the lint reports an unquoted `#` in a description; `maturity: tested` needs an evidence path; the secret scan covers more key shapes; `bumpVersion` is all-or-nothing; the TDD skill tells subagents to record their seam choice; CI actions are pinned to commit SHAs and CI runs on macOS too. The rest of section 5 is still open, in particular rubric scoring, re-running E1 to E4 with more runs, other agents, the `OWNER` placeholder, and the E3 `SPEC.md` wording (left alone so the saved runs stay comparable). The CI workflow has still never run.
