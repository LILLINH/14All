import { findPlaceholders } from './lib/release.mjs';

const problems = findPlaceholders(process.cwd());
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
