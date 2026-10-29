// Re-grade saved runs from their raw transcripts, without calling a model.
//
//   node evals/regrade.mjs <date>      e.g. node evals/regrade.mjs 2026-10-28
//
// Use it after fixing a grader. The old grade is kept in `previousGrade` so a change in
// outcome stays visible.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runIfMain } from './cli.mjs';
import { GRADERS, WEAKENED_TESTS } from './graders.mjs';
import { parseStream } from './parse-stream.mjs';
import { existingRunsDir } from './runs-dir.mjs';
import { invalidReason } from './validity.mjs';

/** Return the summary with its grade recomputed from the raw stream. */
export function regrade(summary, raw) {
  // The working copy of a past run is gone. Use the recorded flag, or infer it from the old grade.
  const testFilesIntact = summary.testFilesIntact ?? summary.grade.criticalFailure !== WEAKENED_TESTS;
  const grade = GRADERS[`grade${summary.taskId}`](parseStream(raw), { testFilesIntact });
  const invalid = invalidReason({ exitStatus: summary.exitStatus, raw });
  return { ...summary, testFilesIntact, invalid, previousGrade: summary.previousGrade ?? summary.grade, grade };
}

function main([date = '']) {
  const dir = existingRunsDir(date);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const rawPath = join(dir, 'raw', file.replace(/\.json$/, '.jsonl'));
    if (!existsSync(rawPath)) {
      console.error(`${file}: raw transcript missing, skipped`);
      continue;
    }
    const updated = regrade(JSON.parse(readFileSync(join(dir, file), 'utf8')), readFileSync(rawPath, 'utf8'));
    writeFileSync(join(dir, file), `${JSON.stringify(updated, null, 2)}\n`);
    console.log(`${file}: ${describeChange(updated)}`);
  }
}

function describeChange({ previousGrade, grade, invalid }) {
  const changed = previousGrade.pass !== grade.pass ? '  (changed)' : '';
  return `pass ${previousGrade.pass} -> ${grade.pass}${changed}${invalid ? `  INVALID: ${invalid}` : ''}`;
}

runIfMain(import.meta.url, main);
