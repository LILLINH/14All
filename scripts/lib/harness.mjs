import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// An audit of a repository for agent-readiness. It checks that certain words and files are present; it does
// not check that the harness works.

export const MAX_INSTRUCTION_BYTES = 32768;
const MAX_HARD_RULES = 15;
const MAX_TEST_DEPTH = 4;
const SKIP_DIRS = new Set(['node_modules', '.git']);

const TEST_COMMAND = /\b(npm (run )?test|pnpm (run )?test|yarn test|pytest|go test|cargo test|make test|mvn test|gradle test|dotnet test|bundle exec rspec|rspec|phpunit|vitest|jest)\b/;
const BUILD_COMMAND = /\b((npm|pnpm|yarn) (run )?(build|start|dev|lint|check|typecheck)|make (build|run|all|check|lint)|cargo (build|run|check|clippy)|go (build|run|vet)|docker compose up|mvn (package|install|verify)|gradle (build|check)|dotnet (build|run)|ruff|eslint|tsc)\b/;
const HARD_RULE = /\b(MUST|NEVER|ALWAYS)\b/;
const PROGRESS = /progress|handoff|\.14all/i;
const TEST_DIR = new Set(['test', 'tests', 'spec', '__tests__']);
const TEST_FILE = /\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|^test_.*\.py$/;
const CI_FILES = ['.gitlab-ci.yml', '.circleci/config.yml', 'azure-pipelines.yml', 'Jenkinsfile'];

/** The instruction files at the root: AGENTS.md, CLAUDE.md, and the file a CLAUDE.md imports with "@file". */
function instructionFiles(dir) {
  const found = [];
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const path = join(dir, name);
    if (existsSync(path) && statSync(path).isFile()) found.push(name);
  }
  if (found.includes('CLAUDE.md')) {
    const imported = /^@(\S+)\s*$/m.exec(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'))?.[1];
    // Only a file under the repository: no absolute path, no "..".
    if (imported && !imported.startsWith('/') && !imported.includes('..') && !found.includes(imported) && existsSync(join(dir, imported))) found.push(imported);
  }
  return found.map((name) => {
    const text = readFileSync(join(dir, name), 'utf8');
    return { name, text, bytes: Buffer.byteLength(text) };
  });
}

/** True when a test directory or test file exists within MAX_TEST_DEPTH levels, outside node_modules and .git. */
function hasTests(dir, depth = 0) {
  if (depth > MAX_TEST_DEPTH) return false;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.isDirectory()) {
      if (TEST_DIR.has(entry.name) || hasTests(join(dir, entry.name), depth + 1)) return true;
    } else if (TEST_FILE.test(entry.name)) {
      return true;
    }
  }
  return false;
}

function hasCi(dir) {
  const workflows = join(dir, '.github', 'workflows');
  if (existsSync(workflows) && readdirSync(workflows).some((f) => /\.ya?ml$/.test(f))) return true;
  return CI_FILES.some((file) => existsSync(join(dir, file)));
}

/** Eight checks over the repository at `dir`. Only the size of the instruction file is critical. */
export function auditHarness(dir) {
  const files = instructionFiles(dir);
  const text = files.map((f) => f.text).join('\n');
  const has = files.length > 0;
  const hardRules = text.split('\n').filter((line) => HARD_RULE.test(line)).length;
  const checks = [
    { id: 'instruction-file', name: 'an instruction file (AGENTS.md or CLAUDE.md) exists', pass: has, critical: false },
    { id: 'size', name: `the instruction file is at most ${MAX_INSTRUCTION_BYTES} bytes`, pass: has && files.every((f) => f.bytes <= MAX_INSTRUCTION_BYTES), critical: true },
    { id: 'test-command', name: 'it names a command that runs the tests', pass: TEST_COMMAND.test(text), critical: false },
    { id: 'build-command', name: 'it names a command that builds, starts or checks the project', pass: BUILD_COMMAND.test(text), critical: false },
    { id: 'has-tests', name: 'the repository has tests', pass: hasTests(dir), critical: false },
    { id: 'ci-config', name: 'a continuous-integration configuration exists', pass: hasCi(dir), critical: false },
    { id: 'few-hard-rules', name: `it holds at most ${MAX_HARD_RULES} lines with MUST, NEVER or ALWAYS`, pass: has && hardRules <= MAX_HARD_RULES, critical: false },
    { id: 'progress-convention', name: 'it names a place for progress notes or handoffs', pass: PROGRESS.test(text), critical: false },
  ];
  return { checks, present: checks.filter((c) => c.pass).length, total: checks.length };
}
