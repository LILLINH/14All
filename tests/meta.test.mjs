import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { validateMeta } from '../scripts/lib/meta.mjs';
import { VALID_META_YAML, ADAPTED_META_YAML } from './helpers.mjs';

const valid = () => parse(VALID_META_YAML);
const adapted = () => parse(ADAPTED_META_YAML);
const hasProblem = (problems, word) => problems.some((p) => p.includes(word));

test('accepts a valid original meta', () => {
  assert.deepEqual(validateMeta(valid()), []);
});

test('accepts a valid adapted meta', () => {
  assert.deepEqual(validateMeta(adapted()), []);
});

test('rejects a non-object meta', () => {
  assert.ok(hasProblem(validateMeta('nope'), 'meta'));
});

test('rejects an unknown class', () => {
  assert.ok(hasProblem(validateMeta({ ...valid(), class: 'copied' }), 'class'));
});

test('rejects an unknown maturity', () => {
  assert.ok(hasProblem(validateMeta({ ...valid(), maturity: 'great' }), 'maturity'));
});

test('rejects a missing owner', () => {
  const { owner, ...rest } = valid();
  assert.ok(hasProblem(validateMeta(rest), 'owner'));
});

test('rejects a malformed last_reviewed date', () => {
  assert.ok(hasProblem(validateMeta({ ...valid(), last_reviewed: 'yesterday' }), 'last_reviewed'));
});

test('adapted requires non-empty sources', () => {
  assert.ok(hasProblem(validateMeta({ ...adapted(), sources: [] }), 'sources'));
});

test('adapted requires changed.made to be true', () => {
  const m = adapted();
  m.changed.made = false;
  assert.ok(hasProblem(validateMeta(m), 'changed'));
});

test('rejects a source license outside MIT and Apache-2.0', () => {
  const m = adapted();
  m.sources[0].license = 'GPL-3.0';
  assert.ok(hasProblem(validateMeta(m), 'license'));
});

test('rejects a source missing a ref', () => {
  const m = adapted();
  delete m.sources[0].ref;
  assert.ok(hasProblem(validateMeta(m), 'ref'));
});
