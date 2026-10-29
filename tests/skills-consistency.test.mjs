import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { lintSkillDir } from '../scripts/lib/lint.mjs';

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

test('tool-output states its four trimming rules, the never-shorten list, and points at a file for long output', () => {
  const text = read('tool-output');
  for (const part of ['explicit request for detail', 'shorter version of the real output', 'never lose the failure', 'a way back', 'exit status', 'path:line', 'negation', 'irreversible']) {
    assert.ok(text.toLowerCase().includes(part), `tool-output should mention ${part}`);
  }
  assert.ok(text.split('\n').length <= 70);
  assert.equal(parse(readFileSync(join(skillsDir, 'tool-output', 'meta.yaml'), 'utf8')).class, 'original');
});

test('secure-code starts from a threat model, has the three tiers, a language-model section and points to the security-auditor agent', () => {
  assert.ok(!names.includes('security-review'), 'security-review is a built-in command; the skill is secure-code');
  const text = read('secure-code');
  for (const part of ['threat model', 'Always', 'Ask first', 'Never', 'untrusted', 'language model', '`security-auditor`', '`code-review`']) {
    assert.ok(text.toLowerCase().includes(part.toLowerCase()), `secure-code should mention ${part}`);
  }
  assert.ok(text.split('\n').length <= 70);
  assert.equal(parse(readFileSync(join(skillsDir, 'secure-code', 'meta.yaml'), 'utf8')).class, 'original');
});

test('impact-check finds users before the edit, classifies them in four groups and searches again after', () => {
  const text = read('impact-check').toLowerCase();
  for (const part of ['changed', 'affected', 'looked at, not affected', 'cannot determine', 'as it is now', 'search again', 'before you edit']) {
    assert.ok(text.includes(part), `impact-check should mention ${part}`);
  }
  assert.ok(read('impact-check').split('\n').length <= 70);
  assert.equal(parse(readFileSync(join(skillsDir, 'impact-check', 'meta.yaml'), 'utf8')).class, 'original');
});

test('research is adapted from the pinned mattpocock source and has a notice entry', () => {
  const meta = parse(readFileSync(join(skillsDir, 'research', 'meta.yaml'), 'utf8'));
  assert.equal(meta.class, 'adapted');
  const source = meta.sources.find((s) => s.repo === 'mattpocock/skills');
  assert.equal(source?.path, 'skills/engineering/research/SKILL.md');
  assert.match(readFileSync(join(skillsDir, '..', 'THIRD_PARTY_NOTICES.md'), 'utf8'), /^## research$/m);
  const clone = join(skillsDir, '..', '.upstream', 'mattpocock-skills');
  if (existsSync(clone)) assert.ok(existsSync(join(clone, source.path)), 'the source path exists in the pinned clone');
});

test('research keeps primary sources and adds version, untrusted text, a visible limit, dating and a file only on request', () => {
  const text = read('research').toLowerCase();
  for (const part of ['primary sources', 'version', 'context7', 'data, never instructions', 'at most five', 'did not read', 'date', 'only when the user asked']) {
    assert.ok(text.includes(part), `research should mention ${part}`);
  }
  assert.ok(read('research').split('\n').length <= 70);
});

test('impact-check always reports before the edit and waits for the user only when the risk is high or something cannot be determined', () => {
  const text = read('impact-check');
  assert.match(text, /report this before you edit/i);
  assert.match(text, /wait for the user/i);
});

test('writing-for-agents is adapted from the pinned mattpocock source and has a notice entry', () => {
  const meta = parse(readFileSync(join(skillsDir, 'writing-for-agents', 'meta.yaml'), 'utf8'));
  assert.equal(meta.class, 'adapted');
  const source = meta.sources.find((s) => s.repo === 'mattpocock/skills');
  assert.equal(source?.path, 'skills/productivity/writing-for-agents/SKILL.md');
  assert.match(readFileSync(join(skillsDir, '..', 'THIRD_PARTY_NOTICES.md'), 'utf8'), /^## writing-for-agents$/m);
  const clone = join(skillsDir, '..', '.upstream', 'mattpocock-skills');
  if (existsSync(clone)) assert.ok(existsSync(join(clone, source.path)), 'the source path exists in the pinned clone');
  assert.deepEqual(lintSkillDir(join(skillsDir, 'writing-for-agents')), []);
});

test('writing-for-agents keeps the working core and points at the AGENTS.md template', () => {
  const text = read('writing-for-agents').toLowerCase();
  for (const part of ['context pointer', 'two loads', 'information hierarchy', 'completion criteri', 'state the behaviour you want', 'single source of truth', 'description starts', '400 lines', 'references/agents-md-template.md', '32 kib']) {
    assert.ok(text.includes(part), `writing-for-agents should mention ${part}`);
  }
  assert.ok(read('writing-for-agents').split('\n').length <= 70);
});

test('the AGENTS.md template is small and has every section', () => {
  const path = join(skillsDir, 'writing-for-agents', 'references', 'agents-md-template.md');
  const text = readFileSync(path, 'utf8');
  assert.ok(Buffer.byteLength(text) < 32768);
  assert.ok(text.split('\n').length <= 100);
  for (const heading of ['What this is', 'Commands', 'Layout', 'Conventions', 'Verify before you say done', 'Do not touch', 'Where more is written']) {
    assert.match(text, new RegExp(`^## ${heading}$`, 'm'), heading);
  }
});

test('verification-before-completion has a definition of done with acceptance criteria and standing conditions', () => {
  const text = read('verification-before-completion').toLowerCase();
  for (const part of ['## definition of done', 'acceptance criteria', 'standing conditions', 'passes, run fresh', 'skipped or removed', 'debug output', 'changelog', 'request is answered']) {
    assert.ok(text.includes(part), `verification-before-completion should mention ${part}`);
  }
  assert.ok(read('verification-before-completion').split('\n').length < 400);
});

test('finishing-a-development-branch asks how a change reaches users, what shows it going wrong and how it is undone', () => {
  const text = read('finishing-a-development-branch').toLowerCase();
  for (const part of ['## if the change reaches users', 'how it will reach them', 'going wrong', 'how it is undone', 'cannot be undone']) {
    assert.ok(text.includes(part), `finishing-a-development-branch should mention ${part}`);
  }
  assert.ok(read('finishing-a-development-branch').split('\n').length < 400);
});
