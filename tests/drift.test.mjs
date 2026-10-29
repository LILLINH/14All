import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestSemverTag, findDrift } from '../scripts/lib/drift.mjs';

test('latestSemverTag picks the highest version, not the last or the longest', () => {
  assert.equal(latestSemverTag(['v1.9.0', 'v1.10.0', 'v1.2.0', 'nightly', 'v2.0.0-rc1']), 'v1.10.0');
});

test('latestSemverTag returns undefined when no tag is a version', () => {
  assert.equal(latestSemverTag(['nightly', 'latest']), undefined);
});

const source = (over = {}) => ({ id: 'a', repo: 'o/a', ref: 'v1.0.0', ...over });

test('findDrift reports a newer upstream release', () => {
  const notes = findDrift([source()], { 'o/a': ['v1.0.0', 'v1.1.0'] });
  assert.equal(notes.length, 1);
  assert.match(notes[0], /o\/a.*v1\.0\.0.*v1\.1\.0/);
});

test('findDrift says nothing when the pin is the latest release', () => {
  assert.deepEqual(findDrift([source()], { 'o/a': ['v0.9.0', 'v1.0.0'] }), []);
});

test('findDrift notes a source pinned to a commit instead of a release tag, without comparing', () => {
  const notes = findDrift([source({ ref: 'a'.repeat(40) })], { 'o/a': ['v9.0.0'] });
  assert.equal(notes.length, 1);
  assert.match(notes[0], /not a release tag/);
});

test('findDrift reports a source whose tags could not be listed', () => {
  assert.match(findDrift([source()], {})[0], /could not list/);
});
