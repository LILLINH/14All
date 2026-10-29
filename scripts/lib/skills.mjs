import { existsSync, readdirSync } from 'node:fs';

export const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_SKILL_NAME = 64;

export const isSkillName = (name) => SKILL_NAME.test(name) && name.length <= MAX_SKILL_NAME;

/** Names of the skill directories directly under skillsRoot: symlinks count, hidden entries do not. A missing root has none. */
export function listSkillDirs(skillsRoot) {
  if (!existsSync(skillsRoot)) return [];
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.') && (e.isDirectory() || e.isSymbolicLink()))
    .map((e) => e.name);
}
