import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invalidReason } from '../evals/validity.mjs';
import { regrade } from '../evals/regrade.mjs';

const line = (o) => JSON.stringify(o);
const assistantText = (t) => line({ type: 'assistant', message: { content: [{ type: 'text', text: t }] } });
const resultLine = (extra = {}) => line({ type: 'result', subtype: 'success', is_error: false, ...extra });
const goodRaw = () => [assistantText('What should it do?'), resultLine()].join('\n');

test('a clean run with a result message is valid', () => {
  assert.equal(invalidReason({ exitStatus: 0, raw: goodRaw() }), null);
});

test('a non-zero exit status makes the run invalid', () => {
  assert.match(invalidReason({ exitStatus: 1, raw: goodRaw() }), /exit/);
});

test('a killed or timed-out run (null status) is invalid', () => {
  assert.match(invalidReason({ exitStatus: null, raw: goodRaw() }), /exit/);
});

test('an empty transcript is invalid', () => {
  assert.match(invalidReason({ exitStatus: 0, raw: '' }), /no events|transcript/);
});

test('a transcript without a result message is invalid', () => {
  assert.match(invalidReason({ exitStatus: 0, raw: assistantText('hi') }), /result/);
});

test('a result that reports an error is invalid', () => {
  const raw = [assistantText('hi'), resultLine({ is_error: true, subtype: 'error_during_execution' })].join('\n');
  assert.match(invalidReason({ exitStatus: 0, raw }), /error/);
});

test('regrade records the validity of the saved run', () => {
  const summary = { taskId: 'E1', mode: 'baseline', run: 1, exitStatus: 0, grade: { pass: true, criticalFailure: null, checks: [] } };
  assert.equal(regrade(summary, goodRaw()).invalid, null);
  assert.match(regrade({ ...summary, exitStatus: 1 }, goodRaw()).invalid, /exit/);
  assert.match(regrade(summary, '').invalid, /transcript|events/);
});
