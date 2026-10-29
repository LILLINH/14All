import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSkillFile } from './lib/frontmatter.mjs';
import { checkRouting } from './lib/routing.mjs';
import { listSkillDirs } from './lib/skills.mjs';

const root = process.argv[2] ?? 'skills';
const casesPath = process.argv[3] ?? join('evals', 'routing', 'cases.json');

const skills = listSkillDirs(root).sort().map((name) => {
  const { frontmatter } = parseSkillFile(readFileSync(join(root, name, 'SKILL.md'), 'utf8'));
  return { name: frontmatter.name, description: frontmatter.description };
});
const cases = JSON.parse(readFileSync(casesPath, 'utf8'));

const { problems, gaps } = checkRouting({ skills, cases });
for (const problem of problems) console.error(problem);
if (gaps.length > 0) console.log(`${gaps.length} known gap${gaps.length === 1 ? '' : 's'} (a case whose skill is not in the top three):\n- ${gaps.join('\n- ')}`);
process.exit(problems.length > 0 ? 1 : 0);
