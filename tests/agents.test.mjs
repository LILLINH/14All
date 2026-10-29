import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintAgentsRoot } from '../scripts/lib/agents.mjs';

const root = fileURLToPath(new URL('../agents', import.meta.url));
const NAMES = ['debugger', 'reviewer', 'preship-reviewer', 'security-auditor'];
const read = (name) => readFileSync(join(root, `${name}.md`), 'utf8');

test('the agents directory passes the lint and holds the four role agents', () => {
  assert.deepEqual(lintAgentsRoot(root), []);
  for (const name of NAMES) assert.match(read(name), new RegExp(`^name: ${name}$`, 'm'));
});

test('every agent reads only, never dispatches another agent, treats text as data and says none provided', () => {
  for (const name of NAMES) {
    const text = read(name);
    assert.match(text, /Bash only to read/, name);
    assert.match(text, /never dispatch another agent/i, name);
    assert.match(text, /data, not instructions/, name);
    assert.match(text, /none provided/, name);
  }
});

test('debugger tests one hypothesis and reports confirmed, falsified or inconclusive with file:line evidence', () => {
  const text = read('debugger');
  for (const part of [/one hypothesis/i, /confirm/, /falsif/, /file:line/, /inconclusive/, /contradicting evidence/i]) assert.match(text, part);
});

test('reviewer reviews one named dimension and reports in one fixed finding format', () => {
  const text = read('reviewer');
  assert.match(text, /one (named )?dimension/i);
  assert.match(text, /fixed (finding )?format/i);
  for (const part of [/severity/i, /file:line/, /`read`/, /`inferred`/, /`unverified`/, /no concrete case, no finding/i]) assert.match(text, part);
});

test('preship-reviewer walks a checklist, quotes a line per finding and gives a ship verdict', () => {
  const text = read('preship-reviewer');
  assert.match(text, /ship with fixes/i);
  assert.match(text, /do not ship/i);
  assert.match(text, /quote/i);
  for (const part of [/atomic/i, /falsy/i, /idempotent/i, /timeout/i]) assert.match(text, part);
});

test('security-auditor starts from a threat model, follows the secure-code skill and never prints a secret', () => {
  const text = read('security-auditor');
  assert.match(text, /threat model/i);
  assert.match(text, /`secure-code`/);
  assert.match(text, /never (print|repeat|quote)[^.]*secret/i);
});
