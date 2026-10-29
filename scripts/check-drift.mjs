import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { findDrift } from './lib/drift.mjs';

// Informational: asks GitHub for each pinned source's tags and says which have newer releases.
// Needs network access, so it is not part of `npm run check`. Pass --strict to exit 1 on drift.
const sources = JSON.parse(readFileSync('upstream/sources.json', 'utf8'));
const tagsByRepo = {};
for (const { repo } of sources) {
  const out = spawnSync('git', ['ls-remote', '--tags', '--refs', `https://github.com/${repo}`], { encoding: 'utf8', timeout: 30000 });
  if (out.status === 0) tagsByRepo[repo] = out.stdout.split('\n').filter(Boolean).map((l) => l.split('refs/tags/')[1]);
}
const notes = findDrift(sources, tagsByRepo);
for (const note of notes) console.log(note);
if (notes.length === 0) console.log('every pinned source is at its latest release');
process.exit(notes.length > 0 && process.argv.includes('--strict') ? 1 : 0);
