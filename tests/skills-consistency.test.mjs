import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillsDir = fileURLToPath(new URL('../skills', import.meta.url));
const read = (name) => readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8');
const names = readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

test('subagent-driven-development says when tasks may run in parallel and points to the parallel skill', () => {
  const text = read('subagent-driven-development');
  assert.match(text, /`dispatching-parallel-agents`/);
  assert.match(text, /in parallel when (their|the) tasks? (share|touch)/i);
  assert.doesNotMatch(text, /Never dispatch several implementers in parallel; /);
});

test('dispatching-parallel-agents says tasks inside a plan stay serial unless they share nothing', () => {
  const text = read('dispatching-parallel-agents');
  assert.match(text, /`subagent-driven-development`/);
  assert.match(text, /serial/i);
});

test('every skill named as "the `x` skill" exists', () => {
  for (const name of names) {
    for (const [, ref] of read(name).matchAll(/the `([a-z0-9-]+)` skill/g)) {
      assert.ok(existsSync(join(skillsDir, ref, 'SKILL.md')), `${name} refers to missing skill ${ref}`);
    }
  }
});
