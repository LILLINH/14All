import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkManifestVersions, bumpVersion } from '../scripts/lib/manifests.mjs';
import { makeRoot } from './helpers.mjs';

function project(files) {
  const root = makeRoot();
  const listed = Object.keys(files).filter((p) => !p.startsWith('!'));
  for (const [path, content] of Object.entries(files)) {
    writeFileSync(join(root, path.replace(/^!/, '')), content);
  }
  writeFileSync(
    join(root, '.version-bump.json'),
    JSON.stringify({ files: listed.map((path) => ({ path, field: 'version' })) }),
  );
  return root;
}

const json = (version) => JSON.stringify({ name: 'x', version });
const readVersion = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8')).version;

test('no problems when every listed file has the package version', () => {
  const root = project({ 'package.json': json('0.1.0'), 'plugin.json': json('0.1.0') });
  assert.deepEqual(checkManifestVersions(root), []);
});

test('reports invalid JSON', () => {
  const root = project({ 'package.json': json('0.1.0'), 'plugin.json': '{ nope' });
  assert.ok(checkManifestVersions(root).some((p) => p.includes('invalid JSON')));
});

test('reports a version mismatch', () => {
  const root = project({ 'package.json': json('0.1.0'), 'plugin.json': json('0.2.0') });
  assert.ok(checkManifestVersions(root).some((p) => p.includes('plugin.json') && p.includes('version')));
});

test('reports a listed file that does not exist', () => {
  const root = project({ 'package.json': json('0.1.0') });
  writeFileSync(
    join(root, '.version-bump.json'),
    JSON.stringify({
      files: [
        { path: 'package.json', field: 'version' },
        { path: 'gone.json', field: 'version' },
      ],
    }),
  );
  assert.ok(checkManifestVersions(root).some((p) => p.includes('gone.json') && p.includes('missing')));
});

test('reports when package.json is not listed', () => {
  const root = project({ 'plugin.json': json('0.1.0'), '!package.json': json('0.1.0') });
  assert.ok(checkManifestVersions(root).some((p) => p.includes('package.json must be listed')));
});

test('bump updates every listed file', () => {
  const root = project({ 'package.json': json('0.1.0'), 'plugin.json': json('0.1.0') });
  bumpVersion(root, '0.2.0');
  assert.equal(readVersion(root, 'package.json'), '0.2.0');
  assert.equal(readVersion(root, 'plugin.json'), '0.2.0');
  assert.deepEqual(checkManifestVersions(root), []);
});

test('bump rejects a version that is not x.y.z', () => {
  const root = project({ 'package.json': json('0.1.0') });
  assert.throws(() => bumpVersion(root, '1.2'), /semver/);
  assert.equal(readVersion(root, 'package.json'), '0.1.0');
});

test('bump changes nothing when one listed file cannot be read', () => {
  const root = project({ 'package.json': json('0.1.0'), 'plugin.json': '{ nope' });
  assert.throws(() => bumpVersion(root, '0.2.0'));
  assert.equal(readVersion(root, 'package.json'), '0.1.0');
});

test('bump changes nothing when a listed file is missing', () => {
  const root = project({ 'package.json': json('0.1.0') });
  writeFileSync(
    join(root, '.version-bump.json'),
    JSON.stringify({
      files: [
        { path: 'package.json', field: 'version' },
        { path: 'gone.json', field: 'version' },
      ],
    }),
  );
  assert.throws(() => bumpVersion(root, '0.2.0'));
  assert.equal(readVersion(root, 'package.json'), '0.1.0');
});
