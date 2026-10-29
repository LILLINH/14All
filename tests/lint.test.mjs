import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintSkillDir } from '../scripts/lib/lint.mjs';
import { findMissingNotices } from '../scripts/check-notices.mjs';
import { makeRoot, writeSkill, validSkillMd, ADAPTED_META_YAML } from './helpers.mjs';

const hasProblem = (problems, word) => problems.some((p) => p.includes(word));

test('a valid skill has no problems', () => {
  const root = makeRoot();
  assert.deepEqual(lintSkillDir(writeSkill(root, 'demo')), []);
});

test('name must equal the directory name', () => {
  const root = makeRoot();
  const dir = writeSkill(root, 'demo', { skill: validSkillMd('other') });
  assert.ok(hasProblem(lintSkillDir(dir), 'name'));
});

test('name must be lowercase letters, digits and hyphens', () => {
  const root = makeRoot();
  const dir = writeSkill(root, 'Demo', { skill: validSkillMd('Demo') });
  assert.ok(hasProblem(lintSkillDir(dir), 'name'));
});

test('name must be at most 64 characters', () => {
  const root = makeRoot();
  const long = 'a'.repeat(65);
  const dir = writeSkill(root, long, { skill: validSkillMd(long) });
  assert.ok(hasProblem(lintSkillDir(dir), 'name'));
});

test('description must not be empty', () => {
  const root = makeRoot();
  const dir = writeSkill(root, 'demo', { skill: '---\nname: demo\ndescription: ""\n---\nbody\n' });
  assert.ok(hasProblem(lintSkillDir(dir), 'description'));
});

test('description must be at most 1024 characters', () => {
  const root = makeRoot();
  const skill = `---\nname: demo\ndescription: ${'x'.repeat(1025)}\n---\nbody\n`;
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { skill })), 'description'));
});

test('frontmatter must not have extra keys', () => {
  const root = makeRoot();
  const skill = '---\nname: demo\ndescription: Use when testing.\nlicense: MIT\n---\nbody\n';
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { skill })), 'extra key'));
});

test('SKILL.md is required', () => {
  const root = makeRoot();
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { skill: null })), 'SKILL.md'));
});

test('invalid frontmatter is reported', () => {
  const root = makeRoot();
  const skill = '---\nname: demo\ndescription: Use when: unquoted\n---\nbody\n';
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { skill })), 'frontmatter'));
});

test('meta.yaml is required', () => {
  const root = makeRoot();
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { meta: null })), 'meta'));
});

test('an invalid meta.yaml is reported', () => {
  const root = makeRoot();
  const dir = writeSkill(root, 'demo', { meta: 'class: nonsense\n' });
  assert.ok(hasProblem(lintSkillDir(dir), 'meta'));
});

test('SKILL.md must be at most 400 lines', () => {
  const root = makeRoot();
  const skill = validSkillMd('demo') + 'line\n'.repeat(400);
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { skill })), 'lines'));
});

test('a symlinked skill directory is rejected', () => {
  const root = makeRoot();
  const outside = makeRoot();
  writeSkill(outside, 'real');
  symlinkSync(join(outside, 'real'), join(root, 'linked'));
  assert.ok(hasProblem(lintSkillDir(join(root, 'linked')), 'symlink'));
});

test('a symlink inside a skill that points outside the skills root is rejected', () => {
  const root = makeRoot();
  const outside = makeRoot();
  writeFileSync(join(outside, 'secret.txt'), 'x');
  const dir = writeSkill(root, 'demo');
  mkdirSync(join(dir, 'references'));
  symlinkSync(join(outside, 'secret.txt'), join(dir, 'references', 'leak.md'));
  assert.ok(hasProblem(lintSkillDir(dir), 'symlink'));
});

test('findMissingNotices flags an adapted skill with no notice heading', () => {
  const root = makeRoot();
  writeSkill(root, 'demo', { meta: ADAPTED_META_YAML });
  assert.deepEqual(findMissingNotices(root, '# Notices\n'), ['demo']);
});

test('findMissingNotices accepts an adapted skill with a notice heading', () => {
  const root = makeRoot();
  writeSkill(root, 'demo', { meta: ADAPTED_META_YAML });
  assert.deepEqual(findMissingNotices(root, '# Notices\n\n## demo\n\nMIT text\n'), []);
});

test('findMissingNotices ignores original skills', () => {
  const root = makeRoot();
  writeSkill(root, 'demo');
  assert.deepEqual(findMissingNotices(root, '# Notices\n'), []);
});

test('an unquoted description with " #" is reported, because YAML cuts it off at the hash', () => {
  const root = makeRoot();
  const skill = '---\nname: demo\ndescription: Use when testing # and more words\n---\nbody\n';
  assert.ok(hasProblem(lintSkillDir(writeSkill(root, 'demo', { skill })), 'comment'));
});

test('a quoted description may contain a hash', () => {
  const root = makeRoot();
  const skill = '---\nname: demo\ndescription: "Use when testing # and more words"\n---\nbody\n';
  assert.deepEqual(lintSkillDir(writeSkill(root, 'demo', { skill })), []);
});
