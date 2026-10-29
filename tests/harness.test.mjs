import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditHarness } from '../scripts/lib/harness.mjs';
import { makeRoot } from './helpers.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const script = join(repoRoot, 'scripts', 'check-harness.mjs');

const AGENTS = [
  '# Demo',
  'Run `npm test` to test. Build with `npm run build`.',
  'Keep session notes in `.14all/progress`.',
  '',
].join('\n');

/** A temp repository with the given files (path -> text). */
function repo(files) {
  const root = makeRoot();
  for (const [path, text] of Object.entries(files).filter(([, value]) => value !== undefined)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}
const COMPLETE = { 'AGENTS.md': AGENTS, 'tests/a.test.mjs': '', '.github/workflows/ci.yml': 'on: push\n' };
const failed = (dir) => auditHarness(dir).checks.filter((c) => !c.pass).map((c) => c.id);

test('a complete repository is 8 of 8', () => {
  const result = auditHarness(repo(COMPLETE));
  assert.equal(result.total, 8);
  assert.equal(result.present, 8);
  assert.deepEqual(failed(repo(COMPLETE)), []);
});

test('each check fails alone when its one thing is removed', () => {
  const without = (text) => repo({ ...COMPLETE, 'AGENTS.md': text });
  assert.deepEqual(failed(without(AGENTS.replace('npm test', 'the suite'))), ['test-command']);
  assert.deepEqual(failed(without(AGENTS.replace('npm run build', 'the build'))), ['build-command']);
  assert.deepEqual(failed(without(AGENTS.replace('.14all/progress', 'somewhere'))), ['progress-convention']);
  assert.deepEqual(failed(without(`${AGENTS}${'You MUST do it.\n'.repeat(16)}`)), ['few-hard-rules']);
  assert.deepEqual(failed(repo({ 'AGENTS.md': AGENTS, '.github/workflows/ci.yml': 'x' })), ['has-tests']);
  assert.deepEqual(failed(repo({ 'AGENTS.md': AGENTS, 'tests/a.test.mjs': '' })), ['ci-config']);
});

test('a CLAUDE.md that only imports AGENTS.md is followed to it', () => {
  const dir = repo({ ...COMPLETE, 'CLAUDE.md': '@AGENTS.md\n' });
  assert.equal(auditHarness(dir).present, 8);
  assert.deepEqual(failed(repo({ ...COMPLETE, 'AGENTS.md': undefined, 'CLAUDE.md': AGENTS })), []);
});

test('an instruction file over 32 KiB is a critical failure and the script exits 1', () => {
  const dir = repo({ ...COMPLETE, 'AGENTS.md': `${AGENTS}${'x'.repeat(33 * 1024)}\n` });
  const size = auditHarness(dir).checks.find((c) => c.id === 'size');
  assert.equal(size.pass, false);
  assert.equal(size.critical, true);
  const run = spawnSync('node', [script, dir], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /7 of 8 present/);
});

test('an empty directory is 0 of 8, with a critical failure', () => {
  const result = auditHarness(makeRoot());
  assert.equal(result.present, 0);
  assert.ok(result.checks.some((c) => !c.pass && c.critical));
});

test('a nested tests directory counts, and one inside node_modules does not', () => {
  assert.ok(!failed(repo({ ...COMPLETE, 'tests/a.test.mjs': undefined, 'pkg/lib/tests/x.mjs': '' })).includes('has-tests'));
  assert.ok(failed(repo({ 'AGENTS.md': AGENTS, '.github/workflows/ci.yml': 'x', 'node_modules/x/test/a.js': '' })).includes('has-tests'));
});

test('the script exits 0 on a complete repository and says it checks words and files, not that the harness works', () => {
  const run = spawnSync('node', [script, repo(COMPLETE)], { encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /8 of 8 present/);
  assert.match(run.stdout, /words and files/);
});

test('the repository passes its own agent-readiness audit, and its instruction files are small', () => {
  const result = auditHarness(repoRoot);
  assert.deepEqual(result.checks.filter((c) => !c.pass && c.critical), []);
  assert.ok(result.present >= 7, `${result.present} of ${result.total} present`);
  assert.ok(readFileSync(join(repoRoot, 'AGENTS.md'), 'utf8').split('\n').length <= 80, 'AGENTS.md is at most 80 lines');
  assert.equal(readFileSync(join(repoRoot, 'CLAUDE.md'), 'utf8').trim(), '@AGENTS.md');
});
