import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanText } from '../scripts/lib/secrets.mjs';
import { makeRoot } from './helpers.mjs';

// Fake secrets are assembled at runtime so this file never matches its own scan.
const awsKey = () => 'AKIA' + 'ABCDEFGHIJKLMNOP';
const ghToken = () => 'ghp_' + 'a'.repeat(36);
const pem = () => '-----BEGIN ' + 'RSA PRIVATE KEY-----';
const generic = () => 'api_key = "' + 'Ab1Cd2Ef3Gh4Ij5Kl6Mn7' + '"';

const patterns = (text) => scanText(text).map((f) => f.pattern);

test('finds an AWS access key id', () => {
  assert.deepEqual(patterns(`id: ${awsKey()}`), ['aws-access-key-id']);
});

test('finds a GitHub token', () => {
  assert.deepEqual(patterns(`token ${ghToken()}`), ['github-token']);
});

test('finds a PEM private key header', () => {
  assert.deepEqual(patterns(pem()), ['private-key']);
});

test('finds a generic api key assignment with a long value', () => {
  assert.deepEqual(patterns(generic()), ['generic-assignment']);
});

test('ignores a placeholder environment variable', () => {
  assert.deepEqual(patterns('api_key = "${CONTEXT7_API_KEY}"'), []);
});

test('ignores a short value', () => {
  assert.deepEqual(patterns('token = "abc123"'), []);
});

test('reports the 1-based line number', () => {
  assert.equal(scanText(`ok\nok\n${awsKey()}\n`)[0].line, 3);
});

const cli = fileURLToPath(new URL('../scripts/scan-secrets.mjs', import.meta.url));

function repoWith(files) {
  const root = makeRoot();
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  spawnSync('git', ['init', '-q'], { cwd: root });
  spawnSync('git', ['add', '-A'], { cwd: root });
  return root;
}

test('cli exits 1, names the file and line, and never prints the secret', () => {
  const root = repoWith({ 'config.txt': `x\n${awsKey()}\n` });
  const result = spawnSync('node', [cli], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  const output = result.stdout + result.stderr;
  assert.match(output, /config\.txt:2/);
  assert.ok(!output.includes(awsKey()));
});

test('cli exits 0 on a clean repository', () => {
  const root = repoWith({ 'a.txt': 'nothing here\n' });
  assert.equal(spawnSync('node', [cli], { cwd: root }).status, 0);
});

test('cli skips tests/fixtures/secrets', () => {
  const root = repoWith({ 'tests/fixtures/secrets/fake.txt': awsKey() });
  assert.equal(spawnSync('node', [cli], { cwd: root }).status, 0);
});

// ---- more provider key shapes (assembled at runtime, like the ones above)

const anthropicKey = () => 'sk-ant-' + 'api03-' + 'Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8';
const openaiKey = () => 'sk-' + 'Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0Uv1Wx2Yz3';
const openaiProjectKey = () => 'sk-proj-' + 'Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0Uv1Wx2Yz3';
const slackToken = () => 'xoxb-' + '1234567890-abcdefghijkl';
const googleKey = () => 'AIza' + 'Sy' + 'A'.repeat(33);

test('finds an Anthropic API key', () => {
  assert.deepEqual(patterns(`key ${anthropicKey()}`), ['anthropic-api-key']);
});

test('finds an OpenAI API key, including the project form, without also reporting it as Anthropic', () => {
  assert.deepEqual(patterns(openaiKey()), ['openai-api-key']);
  assert.deepEqual(patterns(openaiProjectKey()), ['openai-api-key']);
});

test('finds a Slack token', () => {
  assert.deepEqual(patterns(slackToken()), ['slack-token']);
});

test('finds a Google API key', () => {
  assert.deepEqual(patterns(googleKey()), ['google-api-key']);
});

test('does not mistake ordinary hyphenated words for an API key', () => {
  assert.deepEqual(patterns('see risk-assessment-and-mitigation-planning-document-v2 and task-based-scheduling-with-long-identifiers'), []);
});

test('cli skips a tracked file that was deleted from the working tree', () => {
  const root = repoWith({ 'kept.txt': 'fine\n', 'gone.txt': 'fine\n' });
  rmSync(join(root, 'gone.txt'));
  const result = spawnSync('node', [cli], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
