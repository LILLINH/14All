import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rank, topTask, summarize } from '../src/report.mjs';

const makeTasks = () => [
  { title: 'write docs', level: 'low' },
  { title: 'fix bug', level: 'high' },
];

test('high ranks above low', () => {
  assert.ok(rank('high') > rank('low'));
});

test('summary keeps the original order after finding the top task', () => {
  const tasks = makeTasks();
  assert.equal(topTask(tasks).title, 'fix bug');
  assert.equal(summarize(tasks), '2 tasks, first: write docs');
});
