import { auditHarness } from './lib/harness.mjs';

const dir = process.argv[2] ?? '.';
const { checks, present, total } = auditHarness(dir);

console.log(`${dir}: ${present} of ${total} present`);
for (const check of checks) console.log(`${check.pass ? 'present' : check.critical ? 'MISSING (critical)' : 'missing'}  ${check.name}`);
console.log('\nThis audit checks that words and files are present, not that the harness works.');
process.exit(checks.some((c) => !c.pass && c.critical) ? 1 : 0);
