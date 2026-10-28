import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regrade } from '../evals/regrade.mjs';

const line = (o) => JSON.stringify(o);
const use = (id, name, input) => line({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name, input }] } });
const res = (id, content) => line({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } });

// E3 transcript: test written, run cut off by `head` (module missing), implementation, passing run.
const e3Raw = [
  use('a', 'Write', { file_path: '/tmp/x/src/slugify.test.mjs' }),
  use('b', 'Bash', { command: 'npm test 2>&1 | head -20' }),
  res('b', 'TAP version 13\n# Error [ERR_MODULE_NOT_FOUND]: Cannot find module\n'),
  use('c', 'Write', { file_path: '/tmp/x/src/slugify.mjs' }),
  use('d', 'Bash', { command: 'npm test' }),
  res('d', '# tests 5\n# pass 5\n# fail 0\n'),
].join('\n');

const oldSummary = () => ({
  taskId: 'E3',
  mode: '14all',
  run: 1,
  grade: { pass: false, criticalFailure: null, checks: [{ name: 'a failing run came before a passing run', pass: false }] },
});

test('regrade recomputes the grade from the raw transcript and keeps the old grade', () => {
  const out = regrade(oldSummary(), e3Raw);
  assert.equal(out.grade.pass, true);
  assert.equal(out.previousGrade.pass, false);
  assert.equal(out.taskId, 'E3');
});

test('regrade keeps the first previousGrade when run again', () => {
  const once = regrade(oldSummary(), e3Raw);
  const twice = regrade(once, e3Raw);
  assert.equal(twice.previousGrade.pass, false);
});

test('regrade uses the recorded testFilesIntact, and infers it from the old critical failure otherwise', () => {
  const e2 = (grade, extra = {}) => ({ taskId: 'E2', mode: 'baseline', run: 1, grade, ...extra });
  const noCritical = { pass: true, criticalFailure: null, checks: [] };
  const weakened = { pass: false, criticalFailure: 'existing tests were deleted, skipped or weakened', checks: [] };
  assert.equal(regrade(e2(noCritical), '').testFilesIntact, true);
  assert.equal(regrade(e2(weakened), '').testFilesIntact, false);
  assert.equal(regrade(e2(noCritical, { testFilesIntact: false }), '').testFilesIntact, false);
});
