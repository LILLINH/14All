import { readFileSync } from 'node:fs';
import { candidateFiles } from './lib/candidate-files.mjs';
import { findUnsafeText } from './lib/text-safety.mjs';

let found = 0;
for (const file of candidateFiles()) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\0')) continue; // binary
  for (const { line, kind, detail } of findUnsafeText(text)) {
    console.error(`${file}:${line}: ${kind} (${detail})`);
    found += 1;
  }
}
process.exit(found > 0 ? 1 : 0);
