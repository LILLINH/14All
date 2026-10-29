import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRuns, renderCompare } from '../evals/compare.mjs';

const run = (taskId, mode, { pass = true, critical = null, invalid = null } = {}) => ({
  taskId,
  mode,
  invalid,
  grade: { pass, criticalFailure: critical, checks: [] },
});
const times = (n, make) => Array.from({ length: n }, make);
const cell = (taskId, mode, passing, total, extra = {}) =>
  times(total, (_, i) => run(taskId, mode, { pass: i < passing, ...(extra.critical && i < extra.critical ? { critical: 'bad' } : {}) }));
const row = (result, taskId, mode) => result.rows.find((r) => r.taskId === taskId && r.mode === mode);

test('passes when every task has enough valid runs in both modes and 14all is not worse', () => {
  const result = compareRuns([...cell('E1', '14all', 3, 3), ...cell('E1', 'baseline', 1, 3)]);
  assert.equal(result.status, 'pass');
  assert.deepEqual(result.problems, []);
  assert.equal(row(result, 'E1', '14all').passPowK, true);
  assert.equal(row(result, 'E1', 'baseline').passAtK, true);
  assert.equal(row(result, 'E1', 'baseline').passPowK, false);
});

test('fails when a task the baseline ran has no valid 14all run: a dropped case', () => {
  const result = compareRuns([...cell('E1', '14all', 3, 3), ...cell('E1', 'baseline', 3, 3), ...cell('E2', 'baseline', 3, 3)]);
  assert.equal(result.status, 'fail');
  assert.ok(result.problems.some((p) => /E2/.test(p) && /dropped/.test(p)));
});

test('a mode whose runs are all invalid counts as having no valid runs', () => {
  const result = compareRuns([...cell('E1', 'baseline', 3, 3), ...times(3, () => run('E1', '14all', { invalid: 'claude did not exit cleanly' }))]);
  assert.equal(result.status, 'fail');
  assert.ok(result.problems.some((p) => /dropped/.test(p)));
});

test('fails when 14all has more critical failures than the baseline', () => {
  const result = compareRuns([...cell('E1', '14all', 3, 3, { critical: 1 }), ...cell('E1', 'baseline', 3, 3)]);
  assert.equal(result.status, 'fail');
  assert.ok(result.problems.some((p) => /critical/i.test(p)));
});

test('fails when 14all passes fewer runs than the baseline', () => {
  const result = compareRuns([...cell('E1', '14all', 1, 3), ...cell('E1', 'baseline', 2, 3)]);
  assert.equal(result.status, 'fail');
  assert.ok(result.problems.some((p) => /passing/i.test(p)));
});

test('is undecided, never a pass, when a mode has fewer valid runs than the minimum', () => {
  const runs = [...cell('E1', '14all', 2, 2), ...cell('E1', 'baseline', 2, 2)];
  assert.equal(compareRuns(runs).status, 'undecided');
  assert.equal(compareRuns(runs, { minRuns: 2 }).status, 'pass');
});

test('is undecided when only 14all ran a task: there is nothing to compare with', () => {
  const result = compareRuns([...cell('E1', '14all', 3, 3), ...cell('E1', 'baseline', 3, 3), ...cell('E9', '14all', 3, 3)]);
  assert.equal(result.status, 'undecided');
  assert.ok(result.problems.some((p) => /E9/.test(p) && /baseline/.test(p)));
});

test('a failure outranks an undecided task', () => {
  const result = compareRuns([...cell('E1', '14all', 0, 3), ...cell('E1', 'baseline', 3, 3), ...cell('E2', '14all', 1, 1), ...cell('E2', 'baseline', 1, 1)]);
  assert.equal(result.status, 'fail');
});

test('no runs at all is undecided', () => {
  assert.equal(compareRuns([]).status, 'undecided');
});

test('the report names the gate result, lists the problems and says no significance test was run', () => {
  const text = renderCompare(compareRuns([...cell('E1', '14all', 1, 3), ...cell('E1', 'baseline', 3, 3)]));
  assert.match(text, /Gate: FAIL/);
  assert.match(text, /\| E1 \| 14all \| 3 \| 1 \|/);
  assert.match(text, /no significance test/i);
});
