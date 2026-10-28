import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTaskList } from '../src/app.mjs';

test('added tasks are listed as not done', () => {
  const list = createTaskList();
  list.add('write docs');
  assert.deepEqual(list.list(), [{ title: 'write docs', done: false }]);
});

test('completing a task marks it done', () => {
  const list = createTaskList();
  list.add('write docs');
  list.complete('write docs');
  assert.equal(list.list()[0].done, true);
});
