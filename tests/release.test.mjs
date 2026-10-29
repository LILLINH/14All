import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPlaceholders } from '../scripts/lib/release.mjs';
import { makeRoot, writeSkill } from './helpers.mjs';

const cli = fileURLToPath(new URL('../scripts/check-release.mjs', import.meta.url));

function project({ owner = 'someone', metaOwner = 'someone', readme = '# 14All\n' } = {}) {
  const root = makeRoot();
  mkdirSync(join(root, '.claude-plugin'));
  writeFileSync(join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ author: { name: owner }, homepage: `https://github.com/${owner}/14all` }));
  writeFileSync(join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({ owner: { name: owner } }));
  writeFileSync(join(root, 'README.md'), readme);
  const meta = `class: original\nsources: []\nchanged:\n  made: false\n  summary: ""\nmaturity: draft\nadapters_tested: []\nowner: ${metaOwner}\nlast_reviewed: 2026-10-28\n`;
  writeSkill(join(root, 'skills'), 'demo', { meta });
  return root;
}

test('a project with real owner names has no placeholders', () => {
  assert.deepEqual(findPlaceholders(project()), []);
});

test('names every file that still has the OWNER placeholder', () => {
  const found = findPlaceholders(project({ owner: 'OWNER', metaOwner: 'OWNER', readme: 'install OWNER/14all\n' }));
  for (const file of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'skills/demo/meta.yaml', 'README.md']) {
    assert.ok(found.some((p) => p.includes(file)), `expected ${file} in ${JSON.stringify(found)}`);
  }
});

test('a word that merely contains OWNER is not a placeholder', () => {
  assert.deepEqual(findPlaceholders(project({ readme: 'The OWNERSHIP of skills stays with the authors.\n' })), []);
});

test('cli exits 1 while placeholders remain and 0 once they are replaced', () => {
  assert.equal(spawnSync('node', [cli], { cwd: project({ owner: 'OWNER' }) }).status, 1);
  assert.equal(spawnSync('node', [cli], { cwd: project() }).status, 0);
});
