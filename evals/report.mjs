// Summarise saved runs as a Markdown table.
//
//   node evals/report.mjs <date>      e.g. node evals/report.mjs 2026-10-28
//
// Runs marked invalid (the agent never ran: not signed in, out of quota, timeout) are left out
// of every count and reported separately, so they cannot count against either mode.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODE_ORDER = { '14all': 0, baseline: 1 };
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/** Markdown for a list of run summaries (as written by run.mjs and regrade.mjs). */
export function renderReport(summaries) {
  if (summaries.length === 0) return 'No runs to report.\n';
  const valid = summaries.filter((s) => !s.invalid);
  const invalid = summaries.length - valid.length;

  const groups = new Map();
  for (const s of valid) {
    const key = `${s.taskId}\u0000${s.mode}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const rows = [...groups.values()].sort(
    (a, b) => a[0].taskId.localeCompare(b[0].taskId) || (MODE_ORDER[a[0].mode] ?? 9) - (MODE_ORDER[b[0].mode] ?? 9),
  );

  const lines = ['| Task | Mode | Passing | Critical failures | Avg cost | Avg turns |', '|---|---|---|---|---|---|'];
  for (const runs of rows) {
    const passing = runs.filter((r) => r.grade.pass).length;
    const critical = runs.filter((r) => r.grade.criticalFailure).length;
    const costs = runs.map((r) => r.costUsd).filter((c) => typeof c === 'number');
    const turns = runs.map((r) => r.turns).filter((t) => typeof t === 'number');
    lines.push(
      `| ${runs[0].taskId} | ${runs[0].mode} | ${passing} of ${runs.length} | ${critical} | ${costs.length ? `$${mean(costs).toFixed(3)}` : 'n/a'} | ${turns.length ? mean(turns).toFixed(1) : 'n/a'} |`,
    );
  }
  if (invalid > 0) lines.push('', `${invalid} invalid run${invalid === 1 ? '' : 's'} left out (the agent did not run to completion).`);
  return `${lines.join('\n')}\n`;
}

function main(date) {
  const dir = join(fileURLToPath(new URL('.', import.meta.url)), 'runs', date);
  if (!existsSync(dir)) throw new Error(`no runs for ${date}`);
  const summaries = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  process.stdout.write(renderReport(summaries));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv[2] ?? '');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
