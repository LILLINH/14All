import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../evals/report.mjs';

const run = (taskId, mode, over = {}) => ({
  taskId,
  mode,
  run: 1,
  invalid: null,
  costUsd: 0.1,
  turns: 4,
  grade: { pass: true, criticalFailure: null, checks: [] },
  ...over,
});
const failing = (critical = null) => ({ pass: false, criticalFailure: critical, checks: [] });

test('counts passes over the valid runs of each task and mode', () => {
  const report = renderReport([run('E1', '14all'), run('E1', '14all'), run('E1', '14all', { grade: failing() }), run('E1', 'baseline', { grade: failing('edited first') })]);
  assert.match(report, /\| E1 \| 14all \| 2 of 3 \|/);
  assert.match(report, /\| E1 \| baseline \| 0 of 1 \| 1 \|/);
});

test('leaves invalid runs out of the denominator and reports how many there were', () => {
  const report = renderReport([run('E2', 'baseline'), run('E2', 'baseline', { invalid: 'claude did not exit cleanly', grade: failing() })]);
  assert.match(report, /\| E2 \| baseline \| 1 of 1 \|/);
  assert.match(report, /1 invalid run/);
});

test('averages cost and turns over the valid runs', () => {
  const report = renderReport([run('E3', '14all', { costUsd: 0.05, turns: 4 }), run('E3', '14all', { costUsd: 0.15, turns: 8 })]);
  assert.match(report, /\$0\.100 \| 6\.0/);
});

test('says plainly that there is nothing to report', () => {
  assert.match(renderReport([]), /no runs/i);
});

test('orders rows by task, then 14all before baseline', () => {
  const report = renderReport([run('E2', 'baseline'), run('E1', 'baseline'), run('E1', '14all')]);
  assert.ok(report.indexOf('| E1 | 14all') < report.indexOf('| E1 | baseline'));
  assert.ok(report.indexOf('| E1 | baseline') < report.indexOf('| E2 | baseline'));
});
