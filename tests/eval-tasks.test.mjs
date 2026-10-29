import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADERS } from '../evals/graders.mjs';
import { parseArgs, testFilesIntactFor } from '../evals/run.mjs';
import { makeRoot } from './helpers.mjs';

const evals = fileURLToPath(new URL('../evals', import.meta.url));
const IDS = ['E1', 'E2', 'E3', 'E4', 'E13', 'E14'];

for (const id of IDS) {
  test(`${id}.json is a complete task with a fixture and a known grader`, () => {
    const task = JSON.parse(readFileSync(join(evals, 'tasks', `${id}.json`), 'utf8'));
    assert.equal(task.id, id);
    for (const field of ['title', 'fixture', 'prompt', 'grader']) {
      assert.equal(typeof task[field], 'string', `${field} must be a string`);
      assert.notEqual(task[field].trim(), '');
    }
    assert.ok(task.rubric.length > 0 && task.criticalFailures.length > 0);
    assert.ok(existsSync(join(evals, 'fixtures', task.fixture, 'package.json')), 'fixture needs a package.json');
    assert.equal(typeof GRADERS[task.grader], 'function');
  });
}

test('parseArgs reads task id, mode and runs', () => {
  assert.deepEqual(parseArgs(['E4', '--mode', 'baseline', '--runs', '3']), { taskId: 'E4', mode: 'baseline', runs: 3 });
  assert.deepEqual(parseArgs(['E1', '--mode', '14all']), { taskId: 'E1', mode: '14all', runs: 1 });
});

test('parseArgs rejects a bad mode, a bad run count or a missing task', () => {
  assert.throws(() => parseArgs(['E4', '--mode', 'other']), /mode/);
  assert.throws(() => parseArgs(['E4', '--mode', 'baseline', '--runs', '0']), /runs/);
  assert.throws(() => parseArgs(['--mode', 'baseline']), /task/);
});

test('testFilesIntactFor compares the fixture tests with the working copy', () => {
  const fixture = makeRoot();
  const work = makeRoot();
  for (const dir of [fixture, work]) mkdirSync(join(dir, 'tests'));
  const original = "test('a', () => {\n  assert.equal(f(1), 2);\n});\n";
  writeFileSync(join(fixture, 'tests', 'a.test.mjs'), original);

  writeFileSync(join(work, 'tests', 'a.test.mjs'), `${original}test('b', () => {});\n`);
  assert.equal(testFilesIntactFor(fixture, work), true);

  writeFileSync(join(work, 'tests', 'a.test.mjs'), original.replace('2', '3'));
  assert.equal(testFilesIntactFor(fixture, work), false);
});

test('testFilesIntactFor is false when an original test file was deleted', () => {
  const fixture = makeRoot();
  const work = makeRoot();
  mkdirSync(join(fixture, 'tests'));
  writeFileSync(join(fixture, 'tests', 'a.test.mjs'), "test('a', () => {});\n");
  assert.equal(testFilesIntactFor(fixture, work), false);
});

test('testFilesIntactFor is true when the fixture has no tests', () => {
  assert.equal(testFilesIntactFor(makeRoot(), makeRoot()), true);
});

test('the E13 and E14 fixtures declare the framework the simple-code index selects on', () => {
  const deps = (fixture) => JSON.parse(readFileSync(join(evals, 'fixtures', fixture, 'package.json'), 'utf8')).dependencies ?? {};
  assert.ok('react' in deps('e13-react-notes'));
  assert.ok('vue' in deps('e14-vue-notes'));
  assert.ok('pinia' in deps('e14-vue-notes'));
});
