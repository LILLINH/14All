import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRouting, findCollisions, rankSkills } from '../scripts/lib/routing.mjs';

const skills = [
  { name: 'test-first', description: 'Use when writing code test first: write a failing test, watch it fail, then make it pass.' },
  { name: 'root-cause', description: 'Use when a bug or a failing test appears: find the root cause of the error before fixing anything.' },
  { name: 'branch-review', description: 'Use when asked to review a branch or a pull request for quality and correctness before merging.' },
  { name: 'plan-writer', description: 'Use when you have a specification and need a step by step implementation plan.' },
];

test('a prompt is ranked closest to the skill that shares its words', () => {
  assert.equal(rankSkills('my login test fails with an error, find the root cause', skills)[0].name, 'root-cause');
  assert.equal(rankSkills('please review my pull request before merging', skills)[0].name, 'branch-review');
});

test('a prompt that shares no word with any description is ranked without crashing, all at zero', () => {
  const ranked = rankSkills('zzz qqq', skills);
  assert.equal(ranked.length, skills.length);
  assert.ok(ranked.every((r) => r.score === 0));
});

test('a case passes when its skill is in the top three, and fails when it is not', () => {
  const ok = checkRouting({ skills, cases: [{ skill: 'root-cause', prompt: 'find the root cause of this error' }] });
  assert.deepEqual(ok.problems, []);
  const bad = checkRouting({ skills, cases: [{ skill: 'plan-writer', prompt: 'find the root cause of this failing test error' }], topK: 1 });
  assert.equal(bad.problems.length, 1);
  assert.match(bad.problems[0], /plan-writer/);
});

test('a case that names a skill that does not exist is a problem', () => {
  const result = checkRouting({ skills, cases: [{ skill: 'nope', prompt: 'anything' }] });
  assert.match(result.problems[0], /unknown skill/);
});

test('two skills with the same description collide', () => {
  const twin = [{ name: 'alpha', description: skills[0].description }, { name: 'beta', description: skills[0].description }];
  const collisions = findCollisions(twin, 0.75);
  assert.equal(collisions.length, 1);
  assert.deepEqual(collisions[0].slice(0, 2).sort(), ['alpha', 'beta']);
  assert.match(checkRouting({ skills: twin, cases: [] }).problems[0], /collid/i);
  assert.deepEqual(findCollisions(skills, 0.75), []);
});

test('a known-gap case that misses is reported but is not a problem', () => {
  const result = checkRouting({ skills, topK: 1, cases: [{ skill: 'plan-writer', prompt: 'find the root cause of this error', status: 'known-gap', reason: 'the prompt uses other words' }] });
  assert.deepEqual(result.problems, []);
  assert.equal(result.gaps.length, 1);
});

test('a known-gap case needs a reason, and one that now passes is a problem', () => {
  const noReason = checkRouting({ skills, topK: 1, cases: [{ skill: 'plan-writer', prompt: 'find the root cause of this error', status: 'known-gap' }] });
  assert.match(noReason.problems[0], /reason/);
  const passes = checkRouting({ skills, cases: [{ skill: 'root-cause', prompt: 'find the root cause of this error', status: 'known-gap', reason: 'x' }] });
  assert.match(passes.problems[0], /no longer a gap/);
});
