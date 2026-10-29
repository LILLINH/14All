import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SEMVER = /^\d+\.\d+\.\d+$/;

function readList(root) {
  return JSON.parse(readFileSync(join(root, '.version-bump.json'), 'utf8')).files;
}

/** The parsed JSON of root/path. Throws "<path>: file is missing" or "<path>: invalid JSON". */
function readJson(root, path) {
  const full = join(root, path);
  if (!existsSync(full)) throw new Error(`${path}: file is missing`);
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch {
    throw new Error(`${path}: invalid JSON`);
  }
}

/** Check that every file in .version-bump.json is valid JSON with the package.json version. */
export function checkManifestVersions(root) {
  const problems = [];
  const files = readList(root);
  if (!files.some((f) => f.path === 'package.json')) problems.push('package.json must be listed in .version-bump.json');

  let expected;
  try {
    expected = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  } catch {
    problems.push('package.json is missing or invalid JSON');
    return problems;
  }

  for (const { path, field } of files) {
    let data;
    try {
      data = readJson(root, path);
    } catch (err) {
      problems.push(err.message);
      continue;
    }
    if (data[field] !== expected) {
      problems.push(`${path}: ${field} is "${data[field]}" but package.json has "${expected}"`);
    }
  }
  return problems;
}

/**
 * Rewrite the version field in every file listed in .version-bump.json. Every file is read and
 * checked before any is written, so a bad file leaves all of them unchanged.
 */
export function bumpVersion(root, version) {
  if (!SEMVER.test(version)) throw new Error(`version must be semver x.y.z, got "${version}"`);
  const updates = readList(root).map(({ path, field }) => {
    const data = readJson(root, path);
    data[field] = version;
    return { full: join(root, path), text: `${JSON.stringify(data, null, 2)}\n` };
  });
  for (const { full, text } of updates) writeFileSync(full, text);
}
