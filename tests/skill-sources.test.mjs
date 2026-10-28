import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintSkillDir, lintSkillsRoot } from '../scripts/lib/lint.mjs';
import { verifySources } from '../scripts/lib/sources.mjs';
import { makeRoot, writeSkill, ADAPTED_META_YAML } from './helpers.mjs';

const pinned = (over = {}) => ({
  id: 'superpowers',
  repo: 'obra/superpowers',
  ref: 'v1.0.0',
  commit: 'a'.repeat(40),
  licenseFile: 'LICENSE',
  license: 'MIT',
  ...over,
});
const has = (problems, word) => problems.some((p) => p.includes(word));

// ADAPTED_META_YAML cites obra/superpowers at ref v1.0.0 under MIT.

test('an adapted skill whose source matches the pinned list has no problems', () => {
  const dir = writeSkill(makeRoot(), 'demo', { meta: ADAPTED_META_YAML });
  assert.deepEqual(lintSkillDir(dir, { sources: [pinned()] }), []);
});

test('a source repo that is not in upstream/sources.json is rejected', () => {
  const dir = writeSkill(makeRoot(), 'demo', { meta: ADAPTED_META_YAML });
  const problems = lintSkillDir(dir, { sources: [pinned({ repo: 'someone/else' })] });
  assert.ok(has(problems, 'obra/superpowers') && has(problems, 'sources.json'));
});

test('an unpinned ref such as main is rejected', () => {
  const dir = writeSkill(makeRoot(), 'demo', { meta: ADAPTED_META_YAML.replace('v1.0.0', 'main') });
  assert.ok(has(lintSkillDir(dir, { sources: [pinned()] }), 'ref'));
});

test('a license that differs from the pinned entry is rejected', () => {
  const dir = writeSkill(makeRoot(), 'demo', { meta: ADAPTED_META_YAML });
  assert.ok(has(lintSkillDir(dir, { sources: [pinned({ license: 'Apache-2.0' })] }), 'license'));
});

test('without a sources list the cross-check is skipped', () => {
  const dir = writeSkill(makeRoot(), 'demo', { meta: ADAPTED_META_YAML });
  assert.deepEqual(lintSkillDir(dir), []);
});

test('lintSkillsRoot passes the sources list down to every skill', () => {
  const root = makeRoot();
  writeSkill(root, 'demo', { meta: ADAPTED_META_YAML });
  assert.ok(has(lintSkillsRoot(root, { sources: [] }), 'sources.json'));
});

// ---- verifySources: a LICENSE must exist at the pinned commit in the local checkout

function checkout(files) {
  const up = makeRoot();
  const dir = join(up, 'superpowers');
  mkdirSync(dir);
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'init');
  return { up, commit: git('rev-parse', 'HEAD').stdout.trim() };
}

test('verifySources accepts a LICENSE that exists at the pinned commit', () => {
  const { up, commit } = checkout({ LICENSE: 'MIT' });
  assert.deepEqual(verifySources([pinned({ commit })], up), []);
});

test('verifySources rejects a licenseFile that does not exist at the pinned commit', () => {
  const { up, commit } = checkout({ README: 'no license here' });
  assert.ok(has(verifySources([pinned({ commit })], up), 'LICENSE'));
});

test('verifySources rejects a commit that is not in the checkout', () => {
  const { up } = checkout({ LICENSE: 'MIT' });
  assert.ok(has(verifySources([pinned({ commit: 'b'.repeat(40) })], up), 'superpowers'));
});

test('verifySources rejects a source with no checkout', () => {
  assert.ok(has(verifySources([pinned()], makeRoot()), 'checkout'));
});
