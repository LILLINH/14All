import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffoldSkill } from '../scripts/lib/scaffold.mjs';
import { lintSkillDir } from '../scripts/lib/lint.mjs';
import { makeRoot } from './helpers.mjs';

const cli = fileURLToPath(new URL('../scripts/new-skill.mjs', import.meta.url));

test('a scaffolded skill passes the lint as it is', () => {
  const root = makeRoot();
  const dir = scaffoldSkill(root, 'my-new-skill', { owner: 'someone', date: '2026-11-01' });
  assert.deepEqual(lintSkillDir(dir), []);
});

test('the scaffold names the skill, records the owner and date, and starts as an original draft', () => {
  const root = makeRoot();
  const dir = scaffoldSkill(root, 'my-new-skill', { owner: 'someone', date: '2026-11-01' });
  assert.match(readFileSync(join(dir, 'SKILL.md'), 'utf8'), /^name: my-new-skill$/m);
  const meta = readFileSync(join(dir, 'meta.yaml'), 'utf8');
  assert.match(meta, /^class: original$/m);
  assert.match(meta, /^maturity: draft$/m);
  assert.match(meta, /^owner: someone$/m);
  assert.match(meta, /^last_reviewed: 2026-11-01$/m);
});

test('the scaffold refuses an existing skill and a name that is not lowercase-hyphenated', () => {
  const root = makeRoot();
  scaffoldSkill(root, 'taken');
  assert.throws(() => scaffoldSkill(root, 'taken'), /already exists/);
  assert.throws(() => scaffoldSkill(root, 'Bad_Name'), /lowercase/);
  assert.throws(() => scaffoldSkill(root, '../escape'), /lowercase/);
});

test('npm run new-skill creates the skill under ./skills and fails on a second run', () => {
  const root = makeRoot();
  mkdirSync(join(root, 'skills'));
  assert.equal(spawnSync('node', [cli, 'demo-skill'], { cwd: root }).status, 0);
  assert.ok(existsSync(join(root, 'skills', 'demo-skill', 'SKILL.md')));
  assert.equal(spawnSync('node', [cli, 'demo-skill'], { cwd: root }).status, 1);
  assert.equal(spawnSync('node', [cli], { cwd: root }).status, 1);
});
