import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RUNS_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'runs');

/** The directory of saved runs for a date such as 2026-10-28. Throws when there is none. */
export function existingRunsDir(date) {
  const dir = join(RUNS_ROOT, date);
  if (!existsSync(dir)) throw new Error(`no runs for ${date}`);
  return dir;
}
