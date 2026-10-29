// Run one evaluation task against Claude Code and grade the transcript.
//
//   node evals/run.mjs <taskId> --mode baseline|14all [--runs <n>]
//
// Each run copies the task's fixture into a temp directory and calls `claude -p` there.
// `--setting-sources project,local` keeps the user's own plugins out of BOTH modes, so
// the only difference between them is `--plugin-dir <this repo>` in 14all mode.
// Raw transcripts go to evals/runs/<date>/raw/ (git-ignored); one summary JSON per run
// goes next to it. These runs call a model and are never part of CI.

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GRADERS, testsIntact } from './graders.mjs';
import { parseStream } from './parse-stream.mjs';
import { invalidReason } from './validity.mjs';

const evalsDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(evalsDir, '..');

const ALLOWED_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash(npm test:*)', 'Bash(node:*)', 'Bash(ls:*)', 'Bash(cat:*)'];

export function parseArgs(argv) {
  const args = { taskId: undefined, mode: undefined, runs: 1 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--mode') args.mode = argv[++i];
    else if (argv[i] === '--runs') args.runs = Number(argv[++i]);
    else if (!argv[i].startsWith('--')) args.taskId = argv[i];
  }
  if (!args.taskId) throw new Error('missing task id, for example: node evals/run.mjs E4 --mode baseline');
  if (!['baseline', '14all'].includes(args.mode)) throw new Error('mode must be baseline or 14all');
  if (!Number.isInteger(args.runs) || args.runs < 1) throw new Error('runs must be a positive integer');
  return args;
}

/** True when every test file of the fixture is still in the working copy with its original tests. */
export function testFilesIntactFor(fixtureDir, workDir) {
  const testsDir = join(fixtureDir, 'tests');
  if (!existsSync(testsDir)) return true;
  return readdirSync(testsDir).every((name) => {
    const current = join(workDir, 'tests', name);
    return existsSync(current) && testsIntact(readFileSync(join(testsDir, name), 'utf8'), readFileSync(current, 'utf8'));
  });
}

function runOnce(task, mode, index, outDir) {
  const fixtureDir = join(evalsDir, 'fixtures', task.fixture);
  const workDir = mkdtempSync(join(tmpdir(), `14all-eval-${task.id}-`));
  cpSync(fixtureDir, workDir, { recursive: true });

  const args = [
    '-p', task.prompt,
    '--setting-sources', 'project,local',
    '--no-session-persistence',
    '--output-format', 'stream-json',
    '--verbose',
    '--allowedTools', ALLOWED_TOOLS.join(','),
  ];
  if (mode === '14all') args.push('--plugin-dir', repoRoot);

  const started = Date.now();
  const proc = spawnSync('claude', args, { cwd: workDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 15 * 60 * 1000 });
  const raw = proc.stdout ?? '';

  const rawDir = join(outDir, 'raw');
  mkdirSync(rawDir, { recursive: true });
  const stem = `${task.id}-${mode}-${index}`;
  writeFileSync(join(rawDir, `${stem}.jsonl`), raw);

  const events = parseStream(raw);
  const testFilesIntact = testFilesIntactFor(fixtureDir, workDir);
  const grade = GRADERS[task.grader](events, { testFilesIntact });
  const final = raw.trim().split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).findLast((m) => m?.type === 'result');
  const summary = {
    taskId: task.id,
    mode,
    run: index,
    exitStatus: proc.status,
    durationMs: Date.now() - started,
    costUsd: final?.total_cost_usd ?? null,
    turns: final?.num_turns ?? null,
    models: final?.modelUsage ? Object.keys(final.modelUsage) : [],
    testFilesIntact,
    invalid: invalidReason({ exitStatus: proc.status, raw }),
    grade,
  };
  writeFileSync(join(outDir, `${stem}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

function main() {
  const { taskId, mode, runs } = parseArgs(process.argv.slice(2));
  const task = JSON.parse(readFileSync(join(evalsDir, 'tasks', `${taskId}.json`), 'utf8'));
  const outDir = join(evalsDir, 'runs', new Date().toISOString().slice(0, 10));
  for (let i = 1; i <= runs; i += 1) console.log(JSON.stringify(runOnce(task, mode, i, outDir)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
