import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { scanText } from './lib/secrets.mjs';

const SKIP_PREFIX = 'tests/fixtures/secrets/';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((f) => f && !f.startsWith(SKIP_PREFIX));

let found = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\0')) continue; // binary
  for (const { pattern, line } of scanText(text)) {
    console.error(`${file}:${line}: possible secret (${pattern})`);
    found += 1;
  }
}
process.exit(found > 0 ? 1 : 0);
