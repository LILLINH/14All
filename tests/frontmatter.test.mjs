import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSkillFile } from '../scripts/lib/frontmatter.mjs';

test('parses name and description', () => {
  const text = '---\nname: demo\ndescription: Use when testing.\n---\n# Body\n';
  const { frontmatter, body } = parseSkillFile(text);
  assert.deepEqual(frontmatter, { name: 'demo', description: 'Use when testing.' });
  assert.equal(body, '# Body\n');
});

test('handles CRLF and BOM', () => {
  const text = '﻿---\r\nname: demo\r\ndescription: Use when testing.\r\n---\r\n# Body\r\n';
  const { frontmatter, body } = parseSkillFile(text);
  assert.equal(frontmatter.name, 'demo');
  assert.equal(frontmatter.description, 'Use when testing.');
  assert.equal(body, '# Body\n');
});

test('keeps colon, quotes and hash in a quoted description', () => {
  const text = "---\nname: demo\ndescription: 'Use when: the user says \"go\" # not a comment'\n---\nbody\n";
  const { frontmatter } = parseSkillFile(text);
  assert.equal(frontmatter.description, 'Use when: the user says "go" # not a comment');
});

test('throws a clear error for an unquoted colon in a description', () => {
  const text = '---\nname: demo\ndescription: Use when: the user says go\n---\nbody\n';
  assert.throws(() => parseSkillFile(text), /invalid frontmatter/);
});

test('throws when frontmatter is missing', () => {
  assert.throws(() => parseSkillFile('# No frontmatter\n'), /missing frontmatter/);
});
