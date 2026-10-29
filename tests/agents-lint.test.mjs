import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintAgentFile, lintAgentsRoot } from '../scripts/lib/agents.mjs';
import { makeRoot } from './helpers.mjs';

const GOOD = { name: 'sample', description: 'Use when testing the lint.', tools: 'Read, Glob, Grep, Bash' };

/** Write <root>/<file>.md with the given frontmatter fields (a value of undefined leaves the key out). */
function agent(root, file, fields = {}, body = 'You are a sample agent.\n') {
  const merged = { ...GOOD, ...fields };
  const front = Object.entries(merged)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  const path = join(root, `${file}.md`);
  writeFileSync(path, `---\n${front}\n---\n${body}`);
  return path;
}

const problemsFor = (fields, body) => {
  const root = makeRoot();
  return lintAgentFile(agent(root, 'sample', fields, body));
};

test('a valid agent has no problems, and a missing root has none', () => {
  assert.deepEqual(problemsFor({}), []);
  assert.deepEqual(lintAgentsRoot(join(makeRoot(), 'nope')), []);
});

test('the name must equal the file name', () => {
  const problems = problemsFor({ name: 'other' });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /sample\.md.*name/);
});

test('the description must start with "Use when" and stay under 1024 characters', () => {
  assert.match(problemsFor({ description: 'Reviews code.' })[0], /Use when/);
  assert.match(problemsFor({ description: `Use when ${'x'.repeat(1100)}` })[0], /1024/);
});

test('tools are required, read-only and spelled exactly', () => {
  assert.match(problemsFor({ tools: undefined })[0], /tools/);
  assert.match(problemsFor({ tools: 'Read, Write' })[0], /Write/);
  assert.match(problemsFor({ tools: 'Read, Edit, Bash' })[0], /Edit/);
  assert.match(problemsFor({ tools: 'read, glob' })[0], /read/);
  assert.match(problemsFor({ tools: '' })[0], /tools/);
  assert.deepEqual(problemsFor({ tools: 'Read,Glob' }), []);
  assert.deepEqual(problemsFor({ tools: '[Read, Glob]' }), []);
});

test('a model key, or any other key, is a problem', () => {
  assert.match(problemsFor({ model: 'opus' })[0], /model/);
  assert.match(problemsFor({ color: 'red' })[0], /color/);
});

test('a file over 120 lines and a file without frontmatter are problems', () => {
  assert.match(problemsFor({}, 'line\n'.repeat(130))[0], /120/);
  const root = makeRoot();
  writeFileSync(join(root, 'bare.md'), 'No frontmatter here.\n');
  assert.match(lintAgentFile(join(root, 'bare.md'))[0], /bare\.md.*frontmatter/);
});

test('the root lint checks every .md file directly under it and ignores everything else', () => {
  const root = makeRoot();
  agent(root, 'sample');
  agent(root, 'broken', { name: 'wrong' });
  writeFileSync(join(root, 'notes.txt'), 'not an agent');
  mkdirSync(join(root, 'nested'));
  agent(join(root, 'nested'), 'inner', { name: 'wrong' });
  const problems = lintAgentsRoot(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /broken\.md/);
});
