import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const skillsDir = fileURLToPath(new URL('../skills', import.meta.url));
const read = (name) => readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8');
const names = readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

test('subagent-driven-development says when tasks may run in parallel and points to the parallel skill', () => {
  const text = read('subagent-driven-development');
  assert.match(text, /`dispatching-parallel-agents`/);
  assert.match(text, /in parallel when (their|the) tasks? (share|touch)/i);
  assert.doesNotMatch(text, /Never dispatch several implementers in parallel; /);
});

test('dispatching-parallel-agents says tasks inside a plan stay serial unless they share nothing', () => {
  const text = read('dispatching-parallel-agents');
  assert.match(text, /`subagent-driven-development`/);
  assert.match(text, /serial/i);
});

test('every skill named as "the `x` skill" exists', () => {
  for (const name of names) {
    for (const [, ref] of read(name).matchAll(/the `([a-z0-9-]+)` skill/g)) {
      assert.ok(existsSync(join(skillsDir, ref, 'SKILL.md')), `${name} refers to missing skill ${ref}`);
    }
  }
});

test('writing-plans and subagent-driven-development hand inline execution to the executing-plans skill', () => {
  assert.ok(existsSync(join(skillsDir, 'executing-plans', 'SKILL.md')));
  assert.match(read('writing-plans'), /`executing-plans`/);
  assert.match(read('subagent-driven-development'), /`executing-plans`/);
});

test('executing-plans keeps a progress file, rules instead of stalling, and ends with verification and finishing', () => {
  const text = read('executing-plans');
  assert.match(text, /progress file/i);
  assert.match(text, /Ruling:/);
  assert.match(text, /`verification-before-completion`/);
  assert.match(text, /`finishing-a-development-branch`/);
  assert.match(text, /`test-driven-development`/);
});

test('test-driven-development tells a subagent, who cannot ask the user, to record its seam choice in its report', () => {
  assert.match(read('test-driven-development'), /subagent[^.]*cannot ask[^.]*seams?[^.]*records?[^.]*report/i);
});

test('code-review needs a concrete case, labels findings by evidence, and does not hand the reviewer a conclusion', () => {
  const text = read('code-review');
  assert.match(text, /no concrete case, no finding/i);
  assert.match(text, /`read`[^]*`inferred`[^]*`unverified`/);
  assert.match(text, /none provided/);
  assert.match(text, /Reinvented Wheel/);
  assert.match(text, /never the author's (opinion|conclusion)/i);
  assert.ok(text.split('\n').length < 400);
});

test('executing-plans records and rechecks a plan hash', () => {
  const text = read('executing-plans');
  assert.match(text, /Plan hash:/);
  assert.match(text, /git hash-object/);
  assert.match(text, /mismatch[^.]*`Ruling:`/);
});

test('subagent briefs ask for the line range actually read and say "none provided" for a missing input', () => {
  for (const name of ['subagent-driven-development', 'dispatching-parallel-agents']) {
    const text = read(name);
    assert.match(text, /line range/i, name);
    assert.match(text, /truncat/i, name);
    assert.match(text, /none provided/, name);
  }
});

test('handoff is adapted from the pinned mattpocock source and has a notice entry', () => {
  const meta = parse(readFileSync(join(skillsDir, 'handoff', 'meta.yaml'), 'utf8'));
  assert.equal(meta.class, 'adapted');
  assert.ok(meta.sources.some((s) => s.repo === 'mattpocock/skills' && s.path === 'skills/productivity/handoff/SKILL.md'));
  const notices = readFileSync(join(skillsDir, '..', 'THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(notices, /^## handoff$/m);
});

test('handoff names its sections and its rules', () => {
  const text = read('handoff');
  for (const part of ['Verified now', 'Broken or unverified', 'Tried and why it failed', 'Next steps', '.14all/handoff/', '<private>', 'latest message']) {
    assert.ok(text.includes(part), `handoff should mention ${part}`);
  }
  assert.match(text, /data, not instructions/);
  assert.ok(text.split('\n').length <= 60);
});

test('working-notes keeps one notes file in the progress directory with evidence per step', () => {
  const text = read('working-notes');
  for (const part of ['.14all/progress/', '# Progress - notes:', 'Status: pending|in_progress|done', 'Evidence:', '`executing-plans`', '`handoff`', 'three rounds']) {
    assert.ok(text.includes(part), `working-notes should mention ${part}`);
  }
  assert.ok(text.split('\n').length <= 60);
  const meta = parse(readFileSync(join(skillsDir, 'working-notes', 'meta.yaml'), 'utf8'));
  assert.equal(meta.class, 'original');
});

test('systematic-debugging names the debugger agent for competing hypotheses and code-review names the three review agents', () => {
  const debugging = read('systematic-debugging');
  assert.match(debugging, /`debugger` agent/);
  const review = read('code-review');
  for (const agent of ['reviewer', 'preship-reviewer', 'security-auditor']) assert.match(review, new RegExp(`\`${agent}\` agent`), agent);
  assert.ok(debugging.split('\n').length < 400 && review.split('\n').length < 400);
});
