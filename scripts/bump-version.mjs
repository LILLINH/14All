import { bumpVersion } from './lib/manifests.mjs';

try {
  bumpVersion(process.cwd(), process.argv[2] ?? '');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
