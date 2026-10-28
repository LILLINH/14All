import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('node major version is at least 22', () => {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 22);
});

test('package.json is an MIT ESM package at version 0.1.0', () => {
  const p = pkg();
  assert.equal(p.type, 'module');
  assert.equal(p.license, 'MIT');
  assert.equal(p.version, '0.1.0');
});
