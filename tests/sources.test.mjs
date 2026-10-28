import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSources } from '../scripts/lib/sources.mjs';

const entry = () => ({
  id: 'superpowers',
  repo: 'obra/superpowers',
  ref: 'v7.0.0',
  commit: 'a'.repeat(40),
  licenseFile: 'LICENSE',
  license: 'MIT',
});
const hasProblem = (problems, word) => problems.some((p) => p.includes(word));

test('accepts a complete entry', () => {
  assert.deepEqual(validateSources([entry()]), []);
});

test('rejects data that is not a list', () => {
  assert.ok(hasProblem(validateSources({}), 'list'));
});

test('rejects a short commit', () => {
  assert.ok(hasProblem(validateSources([{ ...entry(), commit: 'abc123' }]), 'commit'));
});

test('rejects a missing licenseFile (such a source is link-only)', () => {
  const { licenseFile, ...rest } = entry();
  assert.ok(hasProblem(validateSources([rest]), 'licenseFile'));
});

test('rejects an unknown license', () => {
  assert.ok(hasProblem(validateSources([{ ...entry(), license: 'CC-BY-SA-4.0' }]), 'license'));
});

test('rejects a missing id', () => {
  const { id, ...rest } = entry();
  assert.ok(hasProblem(validateSources([rest]), 'id'));
});
