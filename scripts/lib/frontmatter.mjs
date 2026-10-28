import { parse } from 'yaml';

/**
 * Split a SKILL.md into its YAML frontmatter and Markdown body.
 * Strips a leading BOM and normalizes CRLF to LF first.
 */
export function parseSkillFile(text) {
  const normalized = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) throw new Error('missing frontmatter');
  let frontmatter;
  try {
    frontmatter = parse(match[1]);
  } catch (err) {
    throw new Error(`invalid frontmatter: ${err.message.split('\n')[0]}`);
  }
  if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new Error('invalid frontmatter: expected a mapping');
  }
  return { frontmatter, body: match[2] };
}
