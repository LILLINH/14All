import { scaffoldSkill } from './lib/scaffold.mjs';

const name = process.argv[2];
if (!name) {
  console.error('usage: npm run new-skill -- <skill-name>');
  process.exit(1);
}
try {
  const dir = scaffoldSkill('skills', name);
  console.log(`created ${dir}/SKILL.md and meta.yaml; fill in the TODOs, then run npm run check`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
