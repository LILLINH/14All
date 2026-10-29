import { lintAgentsRoot } from './lib/agents.mjs';

const problems = lintAgentsRoot(process.argv[2] ?? 'agents');
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
