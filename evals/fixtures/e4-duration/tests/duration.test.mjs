import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../src/duration.mjs';

test('parses seconds', () => {
  assert.equal(parseDuration('90s'), 90);
});

test('parses minutes', () => {
  assert.equal(parseDuration('5m'), 300);
});

test('parses a compound duration', () => {
  assert.equal(parseDuration('1h30m'), 5400);
});

test('rejects an empty string', () => {
  assert.throws(() => parseDuration(''), /invalid duration/);
});

test('rejects text that is not a duration', () => {
  assert.throws(() => parseDuration('abc'), /invalid duration/);
});

test('rejects an unknown unit', () => {
  assert.throws(() => parseDuration('5x'), /invalid duration/);
});
