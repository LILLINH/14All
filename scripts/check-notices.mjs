import { existsSync, readFileSync } from 'node:fs';
import { findMissingNotices } from './lib/notices.mjs';

const noticesText = existsSync('THIRD_PARTY_NOTICES.md') ? readFileSync('THIRD_PARTY_NOTICES.md', 'utf8') : '';
const missing = findMissingNotices('skills', noticesText);
for (const name of missing) console.error(`${name}: no "## ${name}" entry in THIRD_PARTY_NOTICES.md`);
process.exit(missing.length > 0 ? 1 : 0);
