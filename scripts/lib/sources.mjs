import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const FIELDS = ['id', 'repo', 'ref', 'commit', 'licenseFile', 'license'];
const LICENSES = ['MIT', 'Apache-2.0'];

/**
 * Validate upstream/sources.json. Every entry must have a LICENSE file at the pinned
 * commit; a source without one is link-only and does not belong in this list.
 */
export function validateSources(data) {
  if (!Array.isArray(data)) return ['sources must be a list'];
  const problems = [];
  data.forEach((entry, i) => {
    const label = entry?.id ?? `#${i}`;
    for (const field of FIELDS) {
      if (typeof entry?.[field] !== 'string' || entry[field].trim() === '') {
        problems.push(`${label}: ${field} is required`);
      }
    }
    if (typeof entry?.commit === 'string' && entry.commit !== '' && !/^[0-9a-f]{40}$/.test(entry.commit)) {
      problems.push(`${label}: commit must be 40 hex characters`);
    }
    if (typeof entry?.license === 'string' && entry.license !== '' && !LICENSES.includes(entry.license)) {
      problems.push(`${label}: license "${entry.license}" must be one of ${LICENSES.join(', ')}`);
    }
  });
  return problems;
}

/**
 * Check that every source a skill's meta.yaml cites is pinned in upstream/sources.json,
 * at the same ref and with the same license. An unpinned ref such as "main" fails.
 */
export function crossCheckSkillSources(metaSources, pinned) {
  const problems = [];
  for (const source of metaSources) {
    const entry = pinned.find((p) => p.repo === source.repo);
    if (!entry) {
      problems.push(`source repo "${source.repo}" is not listed in upstream/sources.json`);
      continue;
    }
    if (source.ref !== entry.ref) {
      problems.push(`source ref "${source.ref}" for ${source.repo} must equal the pinned ref "${entry.ref}"`);
    }
    if (source.license !== entry.license) {
      problems.push(`source license "${source.license}" for ${source.repo} differs from the pinned "${entry.license}"`);
    }
  }
  return problems;
}

/**
 * Check, in a local checkout of each source under upstreamDir/<id>, that the commit exists
 * and that the license file exists at that commit. A source with no LICENSE is link-only.
 */
export function verifySources(sources, upstreamDir) {
  const problems = [];
  for (const { id, commit, licenseFile } of sources) {
    const dir = join(upstreamDir, id);
    if (!existsSync(dir)) {
      problems.push(`${id}: no checkout at ${dir}`);
      continue;
    }
    const probe = spawnSync('git', ['-C', dir, 'cat-file', '-e', `${commit}:${licenseFile}`], { encoding: 'utf8' });
    if (probe.status !== 0) {
      problems.push(`${id}: ${licenseFile} not found at commit ${commit.slice(0, 7)} (or the commit is missing from the checkout)`);
    }
  }
  return problems;
}
