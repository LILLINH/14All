import { lintSkillsRoot } from './lib/lint.mjs';

const problems = lintSkillsRoot(process.argv[2] ?? 'skills');
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
