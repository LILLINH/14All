import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { listSkillDirs } from './skills.mjs';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True for an adapted skill. An unreadable meta.yaml is not one: lint-skills reports it. */
function isAdapted(metaPath) {
  if (!existsSync(metaPath)) return false;
  try {
    return parse(readFileSync(metaPath, 'utf8'))?.class === 'adapted';
  } catch {
    return false;
  }
}

/** Names of adapted skills that have no `## <skill-name>` heading in the notices text. */
export function findMissingNotices(skillsRoot, noticesText) {
  return listSkillDirs(skillsRoot).filter((name) => {
    if (!isAdapted(join(skillsRoot, name, 'meta.yaml'))) return false;
    return !new RegExp(`^## ${escapeRegExp(name)}\\s*$`, 'm').test(noticesText);
  });
}
