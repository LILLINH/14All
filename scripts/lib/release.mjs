import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listSkillDirs } from './skills.mjs';

const PLACEHOLDER = /\bOWNER\b/;
const FILES = ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'README.md'];

/**
 * Files that still carry the `OWNER` placeholder. Not part of `npm run check`, because the
 * placeholder is expected until the repository is published; run `npm run check:release` first.
 */
export function findPlaceholders(root) {
  const files = [...FILES, ...listSkillDirs(join(root, 'skills')).map((name) => `skills/${name}/meta.yaml`)];
  const problems = [];
  for (const file of files) {
    const full = join(root, file);
    if (!existsSync(full)) continue;
    readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
      if (PLACEHOLDER.test(line)) problems.push(`${file}:${i + 1}: placeholder OWNER`);
    });
  }
  return problems;
}
