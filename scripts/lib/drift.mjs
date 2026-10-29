import { COMMIT_SHA } from './shared.mjs';

const SEMVER_TAG = /^v?(\d+)\.(\d+)\.(\d+)$/;

const parts = (tag) => SEMVER_TAG.exec(tag).slice(1).map(Number);

function compare(a, b) {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/** The highest plain x.y.z tag (pre-releases such as v2.0.0-rc1 are ignored), or undefined. */
export function latestSemverTag(tags) {
  return tags.filter((t) => SEMVER_TAG.test(t)).sort(compare).at(-1);
}

/**
 * One note per source that needs a look: a newer release exists, the pin is a commit rather than
 * a tag, or the tags could not be listed. `tagsByRepo` maps "owner/name" to its tag names.
 */
export function findDrift(sources, tagsByRepo) {
  const notes = [];
  for (const { repo, ref } of sources) {
    const tags = tagsByRepo[repo];
    if (!tags) {
      notes.push(`${repo}: could not list its tags, so drift is unknown`);
    } else if (COMMIT_SHA.test(ref) || !SEMVER_TAG.test(ref)) {
      notes.push(`${repo}: pinned to ${ref.slice(0, 7)}, which is not a release tag; compare with upstream by hand`);
    } else {
      const latest = latestSemverTag(tags);
      if (latest && compare(latest, ref) > 0) notes.push(`${repo}: pinned at ${ref}, upstream has released ${latest}`);
    }
  }
  return notes;
}
