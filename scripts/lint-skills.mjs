import { existsSync, readFileSync } from 'node:fs';
import { lintSkillsRoot } from './lib/lint.mjs';

// The cross-check against upstream/sources.json runs whenever that file parses.
let sources;
if (existsSync('upstream/sources.json')) {
  try {
    sources = JSON.parse(readFileSync('upstream/sources.json', 'utf8'));
  } catch {
    // check-sources reports an unreadable sources file.
  }
}

const problems = lintSkillsRoot(process.argv[2] ?? 'skills', { sources });
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
