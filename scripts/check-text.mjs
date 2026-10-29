import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { findUnsafeText } from './lib/text-safety.mjs';

const SKIP_PREFIX = 'tests/fixtures/secrets/';
const TEXT_FILE = /\.(md|json|mjs|yaml|yml)$/;

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((f) => f && !f.startsWith(SKIP_PREFIX) && (TEXT_FILE.test(f) || f.startsWith('hooks/')) && existsSync(f)); // a tracked file may be deleted but not yet committed

let found = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\0')) continue; // binary
  for (const { line, kind, detail } of findUnsafeText(text)) {
    console.error(`${file}:${line}: ${kind} (${detail})`);
    found += 1;
  }
}
process.exit(found > 0 ? 1 : 0);
