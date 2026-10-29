import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
