import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

const SKIP_PREFIX = 'tests/fixtures/secrets/';
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * The files git knows about, tracked or new and not ignored (so a file is checked before it is added), as
 * paths relative to the working directory. The secrets fixtures, anything that is not a regular file, and
 * anything over 2 MB are left out.
 */
export function candidateFiles() {
  const listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0');
  return [...new Set(listed)].filter((f) => f && !f.startsWith(SKIP_PREFIX) && existsSync(f) && statSync(f).isFile() && statSync(f).size <= MAX_BYTES);
}
