import { existsSync, readFileSync } from 'node:fs';
import { validateSources } from './lib/sources.mjs';

const file = 'upstream/sources.json';
let problems;
if (!existsSync(file)) {
  problems = [`${file} is missing`];
} else {
  try {
    problems = validateSources(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    problems = [`${file} is not valid JSON`];
  }
}
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
