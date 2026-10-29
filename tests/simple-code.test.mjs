import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { lintSkillDir } from '../scripts/lib/lint.mjs';

const dir = fileURLToPath(new URL('../skills/simple-code', import.meta.url));
const text = () => readFileSync(join(dir, 'SKILL.md'), 'utf8');

const STEP_TITLES = [
  'Scale the effort',
  'Find what you are in',
  "Learn the project's conventions",
  'Follow written rules',
  'Write the simple version first',
  'Check before saying done',
  'Offer, do not write',
];

test('the skill exists and passes lint', () => {
  assert.deepEqual(lintSkillDir(dir), []);
});

test('meta.yaml marks it original, draft and unmeasured', () => {
  const meta = parse(readFileSync(join(dir, 'meta.yaml'), 'utf8'));
  assert.equal(meta.class, 'original');
  assert.equal(meta.maturity, 'draft');
  assert.deepEqual(meta.sources, []);
  assert.deepEqual(meta.adapters_tested, []);
});

test('the routine has its seven steps in order', () => {
  const steps = [...text().matchAll(/^(\d)\. \*\*(.+?)\*\*/gm)].map((m) => [Number(m[1]), m[2]]);
  assert.deepEqual(steps.map(([n]) => n), [0, 1, 2, 3, 4, 5, 6]);
  STEP_TITLES.forEach((title, i) => assert.ok(steps[i][1].startsWith(title), `step ${i} should start with "${title}", got "${steps[i][1]}"`));
});

test('written rules beat the skill and habits are followed for style only', () => {
  assert.match(text(), /written rule[^.]*wins/i);
  assert.match(text(), /habit[^.]*style/i);
  assert.match(text(), /not copied/i);
});

test('the language-agnostic rules are present', () => {
  for (const phrase of ['function before a class', 'second real use', 'early return', 'Smallest diff', 'speculative']) {
    assert.ok(text().includes(phrase), `missing "${phrase}"`);
  }
});

test('with nothing to learn from, it falls back to the reference defaults', () => {
  assert.match(text(), /no (linter|configuration)[^.]*(default|reference)/i);
});

test('references are chosen from the files you touch, even in a monorepo', () => {
  assert.match(text(), /files you (are about to )?touch/i);
  assert.match(text(), /monorepo|several languages/i);
});

test('a language without a reference gets the agnostic rules and the skill says so', () => {
  assert.match(text(), /no reference[^.]*(agnostic|rules above)/i);
});

test("the user's direct request beats a written rule", () => {
  assert.match(text(), /direct request/i);
});

test('generated and vendored files are not read for conventions, and reading stops early', () => {
  assert.match(text(), /generated|vendored|lock file/i);
  assert.match(text(), /stop(ping)? when/i);
});

test('it offers and does not write the conventions file', () => {
  assert.match(text(), /do not save it unasked/i);
});

test('it names no agent tools', () => {
  assert.doesNotMatch(text(), /\b(TodoWrite|Task tool|Skill tool|Bash tool|Read tool|Edit tool|Write tool|Agent tool)\b/);
});

// ---- references: the shape every file must have, and the index that lists them

const refsDir = join(dir, 'references');
const STATUS_LINE = 'Status: draft, not measured.';
const SECTIONS = ['Simple here looks like', 'Do', 'Do not (what agents over-build here)', 'Check before finishing'];
const MAX_REFERENCE_LINES = 90;

// A framework file, and the language file it builds on.
const LANGUAGE_OF = {
  react: 'javascript',
  vue: 'javascript',
  nextjs: 'javascript',
  nuxt: 'javascript',
  'nodejs-express': 'javascript',
  django: 'python',
  fastapi: 'python',
  'spring-boot': 'java',
  laravel: 'php',
  rails: 'ruby',
  'aspnet-core': 'csharp',
};

const referenceNames = () => (existsSync(refsDir) ? readdirSync(refsDir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort() : []);
const indexedNames = () => [...text().matchAll(/^- `references\/([a-z0-9-]+)\.md`:/gm)].map((m) => m[1]).sort();
const reference = (name) => readFileSync(join(refsDir, `${name}.md`), 'utf8');

test('every indexed reference exists and every reference file is indexed', () => {
  assert.deepEqual(indexedNames(), referenceNames());
});

test('every reference has the same shape', () => {
  for (const name of referenceNames()) {
    const lines = reference(name).replace(/\n$/, '').split('\n');
    assert.equal(lines[0], STATUS_LINE, `${name}: line 1`);
    assert.ok(lines[2]?.startsWith('# '), `${name}: line 3 must be the title`);
    assert.deepEqual(lines.filter((l) => l.startsWith('## ')).map((l) => l.slice(3)), SECTIONS, `${name}: sections`);
    assert.ok(lines.length <= MAX_REFERENCE_LINES, `${name}: ${lines.length} lines (max ${MAX_REFERENCE_LINES})`);
    const check = lines.slice(lines.indexOf(`## ${SECTIONS[3]}`) + 1).filter((l) => l.startsWith('- '));
    assert.ok(check.length >= 3 && check.length <= 5, `${name}: ${check.length} check questions (3 to 5)`);
    for (const question of check) assert.ok(question.trimEnd().endsWith('?'), `${name}: "${question}" must end with ?`);
  }
});

test('every framework reference points at its language reference', () => {
  for (const [framework, language] of Object.entries(LANGUAGE_OF)) {
    if (referenceNames().includes(framework)) assert.ok(reference(framework).includes(`\`${language}.md\``), `${framework} must name \`${language}.md\``);
  }
});

test('no reference names an agent tool', () => {
  for (const name of referenceNames()) {
    assert.doesNotMatch(reference(name), /\b(TodoWrite|Task tool|Skill tool|Bash tool|Read tool|Edit tool|Write tool|Agent tool)\b/, name);
  }
});

// ---- the owner's stack: the excess named for React and Vue

test('react.md names the excess agents add in React', () => {
  const body = reference('react');
  for (const pattern of [/custom hook/i, /context/i, /wrapper component/i, /state (library|management)/i]) assert.match(body, pattern);
});

test('vue.md names the excess agents add in Vue', () => {
  const body = reference('vue');
  for (const pattern of [/composable/i, /wrapper component/i, /Pinia|state library/i]) assert.match(body, pattern);
});
