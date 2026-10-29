// A gate over saved runs: is the 14all mode at least as good as the baseline?
//
//   node evals/compare.mjs <date>      e.g. node evals/compare.mjs 2026-10-28
//
// Exit status: 0 the gate passes, 1 it fails, 2 it cannot decide (too few valid runs, nothing to
// compare with, or no runs for that date). It runs no significance test: with a handful of tasks and
// a few runs each, a p-value would look more certain than the data is. Invalid runs (the agent never
// ran) are left out, so they count against neither mode.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runIfMain } from './cli.mjs';
import { existingRunsDir } from './runs-dir.mjs';

const EXIT_STATUS = { pass: 0, fail: 1, undecided: 2 };
const MODES = ['14all', 'baseline'];

function statsFor(valid, taskId, mode) {
  const runs = valid.filter((s) => s.taskId === taskId && s.mode === mode);
  const passing = runs.filter((s) => s.grade.pass).length;
  return {
    taskId,
    mode,
    valid: runs.length,
    passing,
    critical: runs.filter((s) => s.grade.criticalFailure).length,
    passAtK: passing > 0, // at least one run passed
    passPowK: runs.length > 0 && passing === runs.length, // every run passed
  };
}

/** `a` is worse than `b` on a count out of its valid runs. Compared as rates so unequal run counts are fair. */
const higherRate = (a, b, field) => a[field] * b.valid > b[field] * a.valid;
const lowerRate = (a, b, field) => a[field] * b.valid < b[field] * a.valid;

/**
 * Compare the 14all runs with the baseline runs, task by task. Returns the status ('pass', 'fail' or
 * 'undecided'), the problems found (failures first) and one row of numbers per task and mode.
 */
export function compareRuns(summaries, { minRuns = 3 } = {}) {
  const valid = summaries.filter((s) => !s.invalid);
  const tasks = [...new Set(summaries.map((s) => s.taskId))].sort();
  const rows = tasks.flatMap((taskId) => MODES.map((mode) => statsFor(valid, taskId, mode)));
  const failures = [];
  const undecided = [];

  for (const taskId of tasks) {
    const a = statsFor(valid, taskId, '14all');
    const b = statsFor(valid, taskId, 'baseline');
    if (b.valid > 0 && a.valid === 0) {
      failures.push(`${taskId}: dropped: the baseline has ${b.valid} valid runs and 14all has none`);
    } else if (a.valid === 0 && b.valid === 0) {
      undecided.push(`${taskId}: no valid runs in either mode`);
    } else if (b.valid === 0) {
      undecided.push(`${taskId}: no valid baseline runs to compare with`);
    } else if (a.valid < minRuns || b.valid < minRuns) {
      undecided.push(`${taskId}: needs at least ${minRuns} valid runs per mode (14all has ${a.valid}, baseline ${b.valid})`);
    } else {
      if (higherRate(a, b, 'critical')) failures.push(`${taskId}: 14all has more critical failures (${a.critical} of ${a.valid}) than the baseline (${b.critical} of ${b.valid})`);
      if (lowerRate(a, b, 'passing')) failures.push(`${taskId}: 14all has fewer passing runs (${a.passing} of ${a.valid}) than the baseline (${b.passing} of ${b.valid})`);
    }
  }
  if (tasks.length === 0) undecided.push('there are no runs to compare');

  const status = failures.length > 0 ? 'fail' : undecided.length > 0 ? 'undecided' : 'pass';
  return { status, problems: [...failures, ...undecided], rows };
}

/** Markdown for the result of compareRuns. */
export function renderCompare({ status, problems, rows }) {
  const lines = ['| Task | Mode | Valid runs | Passing | pass@k | pass^k | Critical failures |', '|---|---|---|---|---|---|---|'];
  for (const r of rows) lines.push(`| ${r.taskId} | ${r.mode} | ${r.valid} | ${r.passing} | ${r.passAtK ? 'yes' : 'no'} | ${r.passPowK ? 'yes' : 'no'} | ${r.critical} |`);
  lines.push('', `Gate: ${status.toUpperCase()}`);
  for (const problem of problems) lines.push(`- ${problem}`);
  lines.push('', 'pass@k: at least one run passed. pass^k: every run passed. No significance test is run: a few tasks and a few runs each cannot support one.');
  return `${lines.join('\n')}\n`;
}

function main([date = '']) {
  let dir;
  try {
    dir = existingRunsDir(date);
  } catch (err) {
    console.error(err.message);
    process.exitCode = EXIT_STATUS.undecided;
    return;
  }
  const summaries = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  const result = compareRuns(summaries);
  process.stdout.write(renderCompare(result));
  process.exitCode = EXIT_STATUS[result.status];
}

runIfMain(import.meta.url, main);
