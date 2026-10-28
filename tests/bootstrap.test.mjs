import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lintSkillDir } from '../scripts/lib/lint.mjs';

const dir = fileURLToPath(new URL('../skills/using-14all', import.meta.url));
const skillPath = `${dir}/SKILL.md`;
const text = () => readFileSync(skillPath, 'utf8');

// 2.5k tokens is the Codex session-start cap; at roughly 3 to 4 bytes per token, 8000 bytes is a safe proxy.
const MAX_BYTES = 8000;

test('bootstrap skill exists and passes lint', () => {
  assert.ok(existsSync(skillPath));
  assert.deepEqual(lintSkillDir(dir), []);
});

test(`bootstrap is at most ${MAX_BYTES} bytes`, () => {
  assert.ok(Buffer.byteLength(text(), 'utf8') <= MAX_BYTES);
});

test('bootstrap contains the marker on its own line', () => {
  assert.match(text(), /^14ALL-BOOTSTRAP-V1$/m);
});

test('bootstrap names no agent tools and points to the tools reference', () => {
  const body = text();
  assert.doesNotMatch(body, /\b(TodoWrite|Task tool|Skill tool|Bash tool|Read tool|Edit tool|Write tool|Agent tool)\b/);
  assert.match(body, /references\/claude-code-tools\.md/);
  assert.ok(existsSync(`${dir}/references/claude-code-tools.md`));
});

test('bootstrap states that user instructions take precedence over skills', () => {
  assert.match(text(), /user'?s? (explicit )?instructions/i);
});
