import { existsSync, readFileSync } from 'node:fs';
import { validateSources, verifySources } from './lib/sources.mjs';

// Default: validate upstream/sources.json. With --verify, also confirm in the local
// .upstream/<id> checkouts that each pinned commit has its license file.
const file = 'upstream/sources.json';
let problems;
if (!existsSync(file)) {
  problems = [`${file} is missing`];
} else {
  try {
    const sources = JSON.parse(readFileSync(file, 'utf8'));
    problems = validateSources(sources);
    if (problems.length === 0 && process.argv.includes('--verify')) problems = verifySources(sources, '.upstream');
  } catch {
    problems = [`${file} is not valid JSON`];
  }
}
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
