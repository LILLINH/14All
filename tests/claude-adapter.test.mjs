import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkManifestVersions } from '../scripts/lib/manifests.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => JSON.parse(readFileSync(join(repo, path), 'utf8'));
const plugin = () => read('.claude-plugin/plugin.json');
const marketplace = () => read('.claude-plugin/marketplace.json');

test('plugin.json is named 14all with the package version', () => {
  assert.equal(plugin().name, '14all');
  assert.equal(plugin().version, read('package.json').version);
  assert.equal(plugin().license, 'MIT');
});

test('plugin.json points repository and homepage at the published repository', () => {
  assert.equal(plugin().repository, 'https://github.com/LILLINH/14All');
  assert.equal(plugin().homepage, 'https://github.com/LILLINH/14All');
});

test('marketplace.json lists the 14all plugin from the repository root', () => {
  const m = marketplace();
  assert.equal(m.name, '14all');
  assert.ok(m.owner?.name);
  assert.equal(m.plugins.length, 1);
  assert.equal(m.plugins[0].name, plugin().name);
  assert.equal(m.plugins[0].source, './');
  assert.ok(existsSync(join(repo, m.plugins[0].source, '.claude-plugin', 'plugin.json')));
});

test('everything the plugin relies on exists', () => {
  for (const path of ['skills', 'hooks/hooks.json', 'hooks/session-start', 'skills/using-14all/SKILL.md']) {
    assert.ok(existsSync(join(repo, path)), `${path} must exist`);
  }
  for (const key of ['skills', 'hooks', 'agents', 'commands', 'mcpServers']) {
    if (typeof plugin()[key] === 'string') {
      assert.ok(existsSync(join(repo, plugin()[key])), `plugin.json ${key} path must exist`);
    }
  }
});

test('plugin.json is listed in .version-bump.json and versions agree', () => {
  const listed = read('.version-bump.json').files.map((f) => f.path);
  assert.ok(listed.includes('.claude-plugin/plugin.json'));
  assert.deepEqual(checkManifestVersions(repo), []);
});
