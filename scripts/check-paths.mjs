import { readFileSync } from 'node:fs';
import { candidateFiles } from './lib/candidate-files.mjs';
import { findPersonalPaths } from './lib/personal-paths.mjs';

let found = 0;
for (const file of candidateFiles()) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\0')) continue; // binary
  for (const { line } of findPersonalPaths(text)) {
    console.error(`${file}:${line}: a path in a real person's home directory (use a placeholder such as <repo> or /home/user/...)`);
    found += 1;
  }
}
process.exit(found > 0 ? 1 : 0);
