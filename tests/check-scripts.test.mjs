import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRoot } from './helpers.mjs';

const scripts = fileURLToPath(new URL('../scripts', import.meta.url));
const hidden = String.fromCodePoint(0xE0041);

/** A git repository holding the given files, none of them added. */
function repoWith(files) {
  const dir = makeRoot();
  spawnSync('git', ['init', '-q'], { cwd: dir });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
const run = (script, dir) => spawnSync('node', [join(scripts, script)], { cwd: dir, encoding: 'utf8' });

test('check-text and check-paths look at untracked files and at every kind of text file', () => {
  const home = `cd /home/${'alice'}/work\n`;
  for (const name of ['x.md', 'x.sh', 'x.js', 'x.vue', 'x.log', 'x.txt']) {
    const bad = repoWith({ [name]: `a${hidden}b\n` });
    assert.equal(run('check-text.mjs', bad).status, 1, `check-text ${name}`);
    const path = repoWith({ [name]: home });
    assert.equal(run('check-paths.mjs', path).status, 1, `check-paths ${name}`);
  }
});

test('check-text and check-paths pass on clean files and skip a binary file', () => {
  const dir = repoWith({ 'a.md': 'plain text\n', 'b.bin': `x\0${hidden}\0` });
  assert.equal(run('check-text.mjs', dir).status, 0);
  assert.equal(run('check-paths.mjs', dir).status, 0);
});
