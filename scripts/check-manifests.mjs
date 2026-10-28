import { checkManifestVersions } from './lib/manifests.mjs';

const problems = checkManifestVersions(process.cwd());
for (const problem of problems) console.error(problem);
process.exit(problems.length > 0 ? 1 : 0);
