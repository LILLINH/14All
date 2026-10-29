// Summarise saved runs as a Markdown table.
//
//   node evals/report.mjs <date>      e.g. node evals/report.mjs 2026-10-28
//
// Runs marked invalid (the agent never ran: not signed in, out of quota, timeout) are left out
// of every count and reported separately, so they cannot count against either mode. A run is
// inconclusive when its evidence could not be read (a test run cut off before its summary): it
// is counted in its own column and is not a pass.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runIfMain } from './cli.mjs';
import { existingRunsDir } from './runs-dir.mjs';

const MODE_ORDER = { '14all': 0, baseline: 1 };
const UNKNOWN_MODE_RANK = 9;
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/** Runs grouped by task and mode, ordered by task, then 14all before baseline. */
function groupByTaskAndMode(summaries) {
  const groups = new Map();
  for (const s of summaries) {
    const key = `${s.taskId}\u0000${s.mode}`;
    if (groups.has(key)) groups.get(key).push(s);
    else groups.set(key, [s]);
  }
  const rank = ([run]) => MODE_ORDER[run.mode] ?? UNKNOWN_MODE_RANK;
  return [...groups.values()].sort((a, b) => a[0].taskId.localeCompare(b[0].taskId) || rank(a) - rank(b));
}

/** The numbers that exist, averaged to the given decimals, or "n/a" when no run recorded one. */
function average(runs, field, format) {
  const values = runs.map((r) => r[field]).filter((v) => typeof v === 'number');
  return values.length ? format(mean(values)) : 'n/a';
}

function row(runs) {
  const { taskId, mode } = runs[0];
  const passing = runs.filter((r) => r.grade.pass).length;
  const critical = runs.filter((r) => r.grade.criticalFailure).length;
  const cost = average(runs, 'costUsd', (v) => `$${v.toFixed(3)}`);
  const turns = average(runs, 'turns', (v) => v.toFixed(1));
  const inconclusive = runs.filter((r) => r.grade.inconclusive).length;
  return `| ${taskId} | ${mode} | ${passing} of ${runs.length} | ${critical} | ${cost} | ${turns} | ${inconclusive} |`;
}

/** Markdown for a list of run summaries (as written by run.mjs and regrade.mjs). */
export function renderReport(summaries) {
  if (summaries.length === 0) return 'No runs to report.\n';
  const valid = summaries.filter((s) => !s.invalid);
  const invalid = summaries.length - valid.length;

  const lines = ['| Task | Mode | Passing | Critical failures | Avg cost | Avg turns | Inconclusive |', '|---|---|---|---|---|---|---|'];
  for (const runs of groupByTaskAndMode(valid)) lines.push(row(runs));
  if (invalid > 0) lines.push('', `${invalid} invalid run${invalid === 1 ? '' : 's'} left out (the agent did not run to completion).`);
  return `${lines.join('\n')}\n`;
}

function main([date = '']) {
  const dir = existingRunsDir(date);
  const summaries = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  process.stdout.write(renderReport(summaries));
}

runIfMain(import.meta.url, main);
