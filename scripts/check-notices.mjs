import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Names of adapted skills that have no `## <skill-name>` heading in the notices text. */
export function findMissingNotices(skillsRoot, noticesText) {
  if (!existsSync(skillsRoot)) return [];
  const missing = [];
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || !(entry.isDirectory() || entry.isSymbolicLink())) continue;
    const metaPath = join(skillsRoot, entry.name, 'meta.yaml');
    if (!existsSync(metaPath)) continue;
    let meta;
    try {
      meta = parse(readFileSync(metaPath, 'utf8'));
    } catch {
      continue; // lint-skills reports invalid meta
    }
    if (meta?.class !== 'adapted') continue;
    const heading = new RegExp(`^## ${escapeRegExp(entry.name)}\\s*$`, 'm');
    if (!heading.test(noticesText)) missing.push(entry.name);
  }
  return missing;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const noticesText = existsSync('THIRD_PARTY_NOTICES.md') ? readFileSync('THIRD_PARTY_NOTICES.md', 'utf8') : '';
  const missing = findMissingNotices('skills', noticesText);
  for (const name of missing) console.error(`${name}: no "## ${name}" entry in THIRD_PARTY_NOTICES.md`);
  process.exit(missing.length > 0 ? 1 : 0);
}
