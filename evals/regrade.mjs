// Re-grade saved runs from their raw transcripts, without calling a model.
//
//   node evals/regrade.mjs <date>      e.g. node evals/regrade.mjs 2026-10-28
//
// Use it after fixing a grader. The old grade is kept in `previousGrade` so a change in
// outcome stays visible.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GRADERS } from './graders.mjs';
import { parseStream } from './parse-stream.mjs';
import { invalidReason } from './validity.mjs';

const WEAKENED = 'existing tests were deleted, skipped or weakened';

/** Return the summary with its grade recomputed from the raw stream. */
export function regrade(summary, raw) {
  // The working copy of a past run is gone. Use the recorded flag, or infer it from the old grade.
  const testFilesIntact = summary.testFilesIntact ?? summary.grade.criticalFailure !== WEAKENED;
  const grade = GRADERS[`grade${summary.taskId}`](parseStream(raw), { testFilesIntact });
  const invalid = invalidReason({ exitStatus: summary.exitStatus, raw });
  return { ...summary, testFilesIntact, invalid, previousGrade: summary.previousGrade ?? summary.grade, grade };
}

function main(date) {
  const dir = join(fileURLToPath(new URL('.', import.meta.url)), 'runs', date);
  if (!existsSync(dir)) throw new Error(`no runs for ${date}`);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const rawPath = join(dir, 'raw', file.replace(/\.json$/, '.jsonl'));
    if (!existsSync(rawPath)) {
      console.error(`${file}: raw transcript missing, skipped`);
      continue;
    }
    const updated = regrade(JSON.parse(readFileSync(join(dir, file), 'utf8')), readFileSync(rawPath, 'utf8'));
    writeFileSync(join(dir, file), `${JSON.stringify(updated, null, 2)}\n`);
    const changed = updated.previousGrade.pass !== updated.grade.pass;
    console.log(`${file}: pass ${updated.previousGrade.pass} -> ${updated.grade.pass}${changed ? '  (changed)' : ''}${updated.invalid ? `  INVALID: ${updated.invalid}` : ''}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv[2] ?? '');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
