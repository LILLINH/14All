import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const readme = readFileSync(join(repo, 'README.md'), 'utf8');

test('README install lines use the marketplace add and install commands', () => {
  assert.match(readme, /\/plugin marketplace add \S+/);
  assert.match(readme, /\/plugin install 14all@14all/);
  assert.doesNotMatch(readme, /--marketplace/);
});

test('every repository path the README links or names exists', () => {
  const paths = new Set();
  for (const [, target] of readme.matchAll(/\]\(([^)#\s]+)\)/g)) if (!/^[a-z]+:/.test(target)) paths.add(target);
  for (const [, target] of readme.matchAll(/`((?:docs|evals|skills|scripts|hooks)\/[\w./-]+)`/g)) paths.add(target);
  assert.ok(paths.size > 0);
  for (const path of paths) assert.ok(existsSync(join(repo, path)), `README names ${path}, which does not exist`);
});

test('the repository keeps its specs and plans where its own skills say to save them', () => {
  assert.ok(existsSync(join(repo, 'docs', 'specs')), 'docs/specs is where the brainstorming skill saves designs');
  assert.ok(existsSync(join(repo, 'docs', 'plans')), 'docs/plans is where the writing-plans skill saves plans');
  assert.ok(!existsSync(join(repo, 'docs', 'superpowers')), 'docs/superpowers is the old location');
});

const scripts = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).scripts;
const doc = (name) => readFileSync(join(repo, name), 'utf8');

test('the contributor docs exist and every npm script they name is defined', () => {
  for (const file of ['CONTRIBUTING.md', 'CHANGELOG.md', 'SECURITY.md']) assert.ok(existsSync(join(repo, file)), `${file} is missing`);
  for (const file of ['README.md', 'CONTRIBUTING.md']) {
    for (const [, name] of doc(file).matchAll(/npm run ([a-z:-]+)/g)) {
      assert.ok(name in scripts, `${file} names "npm run ${name}", which package.json does not define`);
    }
  }
});

test('CONTRIBUTING explains adding a skill, the lint, the evidence rule and the guard hook', () => {
  const text = doc('CONTRIBUTING.md');
  assert.match(text, /npm run new-skill/);
  assert.match(text, /npm run check/);
  assert.match(text, /docs\/evidence/);
  assert.match(text, /hooks\/guard/);
});

test('the README says what the guard hook blocks, that it is not a security boundary, and how to turn it off', () => {
  assert.match(readme, /ALL14_GUARD=off/);
  assert.match(readme, /not a security boundary/i);
});

test('the changelog has an Unreleased section', () => {
  assert.match(doc('CHANGELOG.md'), /^## Unreleased$/m);
});

test('CI pins every action to a commit SHA, runs on Linux and macOS, and shellchecks the guard and the wrapper', () => {
  const ci = readFileSync(join(repo, '.github', 'workflows', 'ci.yml'), 'utf8');
  const uses = [...ci.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
  assert.ok(uses.length > 0);
  for (const use of uses) assert.match(use, /@[0-9a-f]{40}$/, `${use} must be pinned to a commit SHA`);
  assert.match(ci, /ubuntu-latest/);
  assert.match(ci, /macos-latest/);
  assert.match(ci, /hooks\/guard/);
  assert.match(ci, /run-hook\.cmd/);
});

test('the README does not claim more agents than the evidence files back', () => {
  const intro = readme.split('\n').slice(0, 5).join('\n');
  assert.doesNotMatch(intro, /Codex|Cursor|Gemini/, 'the opening lines must not name agents that have no evidence file');
  assert.match(intro, /only Claude Code/i);
});

test('README says simple-code exists and is unmeasured', () => {
  assert.match(readme, /`skills\/simple-code`/);
  assert.match(readme, /unmeasured/i);
});

test('the README names handoff and working-notes as drafts and the resume block with its switch', () => {
  assert.match(readme, /`skills\/handoff`/);
  assert.match(readme, /`skills\/working-notes`/);
  assert.match(readme, /ALL14_RESUME=off/);
  assert.match(readme, /drafts/i);
  assert.match(readme, /no evaluation has measured/i);
});

test('THIRD_PARTY_NOTICES credits ideas without claiming text was copied', () => {
  const notices = doc('THIRD_PARTY_NOTICES.md');
  assert.match(notices, /^## Ideas credited \(no text copied\)$/m);
  const section = notices.split('## Ideas credited (no text copied)')[1];
  for (const name of ['ponytail', 'planning-with-files', 'learn-harness-engineering', 'agent-skills', 'claude-mem']) {
    assert.ok(section.includes(name), `the credits should name ${name}`);
  }
});

test('the evals README documents the Inconclusive column, the validity rule and eval:compare', () => {
  const text = readFileSync(join(repo, 'evals', 'README.md'), 'utf8');
  assert.match(text, /Inconclusive/);
  assert.match(text, /14ALL-BOOTSTRAP-V1/);
  assert.match(text, /npm run eval:compare/);
  assert.ok('eval:compare' in scripts);
});

test('the changelog records the Phase 1 additions', () => {
  const text = doc('CHANGELOG.md');
  for (const part of ['handoff', 'working-notes', 'resume block', 'eval:compare']) assert.ok(text.includes(part), `the changelog should mention ${part}`);
});

test('the README names the four new skills and the agents directory, as drafts, with the agents seen listed once and their tool list not verified', () => {
  for (const name of ['tool-output', 'secure-code', 'impact-check', 'research']) assert.match(readme, new RegExp(`\`skills/${name}\``), name);
  assert.match(readme, /`agents\/`/);
  assert.match(readme, /drafts/i);
  assert.match(readme, /seen listed in one headless session/);
  assert.match(readme, /is not verified/i);
  assert.match(readme, /E15/);
});

test('CONTRIBUTING explains how to add a role agent and names its lint', () => {
  const text = doc('CONTRIBUTING.md');
  assert.match(text, /## Add a role agent/);
  assert.match(text, /lint-agents/);
});

test('the changelog records the four skills, the agents and E15', () => {
  const text = doc('CHANGELOG.md');
  for (const part of ['tool-output', 'secure-code', 'impact-check', '`research`', 'agents/', 'E15']) assert.ok(text.includes(part), `the changelog should mention ${part}`);
});

test('the credits name the Phase 2 sources and still say no text was copied', () => {
  const section = doc('THIRD_PARTY_NOTICES.md').split('## Ideas credited (no text copied)')[1];
  for (const name of ['rtk', 'headroom', 'context-mode', 'Understand-Anything', 'career-ops', 'wshobson/agents', 'agent-skills']) {
    assert.ok(section.includes(name), `the credits should name ${name}`);
  }
  assert.match(section, /Elastic-2\.0/);
});

test('the README and the evidence do not claim that other coding agents ignore agents/, which nobody checked', () => {
  assert.doesNotMatch(readme, /Only Claude Code reads this directory/);
  assert.match(readme, /not known to read this directory/i);
  assert.doesNotMatch(readFileSync(join(repo, 'docs', 'evidence', 'claude-code.md'), 'utf8'), /which do not read/);
});

test('the README names writing-for-agents, the web UI reference and the audit, and says what the new checks cannot show', () => {
  assert.match(readme, /`skills\/writing-for-agents`/);
  assert.match(readme, /`skills\/simple-code\/references\/web-ui\.md`/);
  assert.match(readme, /npm run check:harness/);
  assert.match(readme, /not whether a model/i);
  assert.match(readme, /known gaps?/i);
});

test('CONTRIBUTING lists the new checks and points to writing-for-agents for writing a skill', () => {
  const text = doc('CONTRIBUTING.md');
  for (const part of ['check-text', 'check-paths', 'check-routing', 'check:harness', 'writing-for-agents', 'known-gap']) assert.ok(text.includes(part), `CONTRIBUTING should mention ${part}`);
});

test('the changelog records the Phase 3 additions', () => {
  const text = doc('CHANGELOG.md');
  for (const part of ['writing-for-agents', 'web-ui', 'check:harness', 'check-routing', 'check-text', 'check-paths', 'AGENTS.md', 'Definition of done']) assert.ok(text.includes(part), `the changelog should mention ${part}`);
});

test('the credits name the Phase 3 sources and still say no text was copied', () => {
  const section = doc('THIRD_PARTY_NOTICES.md').split('## Ideas credited (no text copied)')[1];
  for (const name of ['ui-ux-pro-max', 'taste-skill', 'learn-harness-engineering', 'everything-claude-code', 'agent-skills']) assert.ok(section.includes(name), `the credits should name ${name}`);
  assert.match(section, /The wording in 14All is its own/);
});

test('the README states the real number of known routing gaps', () => {
  const cases = JSON.parse(readFileSync(join(repo, 'evals', 'routing', 'cases.json'), 'utf8'));
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const gaps = cases.filter((c) => c.status === 'known-gap').length;
  assert.ok(gaps < words.length, 'update this test for more gaps');
  assert.ok(readme.includes(`there are ${words[gaps]}`), `the README should say "there are ${words[gaps]}" known gaps`);
});
