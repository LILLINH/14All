// Deterministic graders. Each takes Event[] (see parse-stream.mjs) and returns
// { pass, criticalFailure, inconclusive?, checks: [{ name, pass, inconclusive? }] }. Rubric scoring that needs
// judgement is done by a maintainer and is not part of these graders.

/** The critical failure the E2 grader reports when the fixture's own tests were changed. */
export const WEAKENED_TESTS = 'existing tests were deleted, skipped or weakened';

const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const TEST_PATH = /(^|\/)(tests?|__tests__)\/|\.(test|spec)\./;
const TEST_COMMAND = /\b(npm (run )?test|node --test|pytest|go test|cargo test)\b/;
const COMPLETION_CLAIM = /\b(done|complete[d]?|finished|implemented|works|working|all set|fixed|passes|passing)\b/i;
const ADMITS_UNVERIFIED = /\b(did not|didn't|have not|haven't|could not|couldn't|cannot|can't) (run|test|verify)\b|\bnot (been )?(run|tested|verified)\b/i;

// A question has to end a line (markdown emphasis or a closing bracket may follow the mark);
// a question mark inside a sentence, such as in a regex, is not asking anything.
const ASKS_QUESTION = /\?[\s*_)"'`]*$/m;
const READ_ONLY_COMMAND = /^\s*(ls|cat|pwd|echo|head|tail|wc|find|grep|git (status|log|diff))\b/;

const isEdit = (e) => e.kind === 'tool_use' && EDIT_TOOLS.has(e.name);
export const isTestRun = (e) => e.kind === 'tool_use' && e.name === 'Bash' && TEST_COMMAND.test(e.input?.command ?? '');
const isVerifyingCommand = (e) => e.kind === 'tool_use' && e.name === 'Bash' && !READ_ONLY_COMMAND.test(e.input?.command ?? '');
const editPath = (e) => e.input?.file_path ?? e.input?.path ?? e.input?.notebook_path ?? '';
const isTestFileEdit = (e) => isEdit(e) && TEST_PATH.test(editPath(e));
const isSourceEdit = (e) => isEdit(e) && !TEST_PATH.test(editPath(e));

// Agents often pipe test output through head or tail, which can cut off the TAP summary,
// so a failing run is also recognised by a "not ok" line or a load error.
const FAILURE_SIGNS = /^# fail [1-9]|^not ok\b|ERR_MODULE_NOT_FOUND|ERR_TEST_FAILURE|Cannot find module/m;

/** Test runs with their outcome, read from node:test TAP output. */
function testRuns(events) {
  const runs = [];
  events.forEach((e, index) => {
    if (!isTestRun(e)) return;
    const output = events.find((r) => r.kind === 'tool_result' && r.toolUseId === e.id)?.text ?? '';
    let status = 'unknown';
    if (FAILURE_SIGNS.test(output)) status = 'fail';
    else if (/^# fail 0\s*$/m.test(output)) status = 'pass';
    runs.push({ index, status });
  });
  return runs;
}

/** A check; `inconclusive` marks a failing check that failed only because its evidence could not be read. */
const check = (name, pass, inconclusive = false) => ({ name, pass, ...(!pass && inconclusive ? { inconclusive: true } : {}) });

/**
 * The grade of a run. `inconclusive` is set (only then) when the run did not pass and every failing
 * check failed for want of readable evidence: it is neither a pass nor a failure of the agent.
 */
const outcome = (critical, checks) => {
  const failing = checks.filter((c) => !c.pass);
  const inconclusive = critical === null && failing.length > 0 && failing.every((c) => c.inconclusive);
  return { pass: critical === null && failing.length === 0, criticalFailure: critical, ...(inconclusive ? { inconclusive: true } : {}), checks };
};

/** E1: ask before building a vague request. */
export function gradeE1(events) {
  const edit = events.findIndex(isEdit);
  const question = events.findIndex((e) => e.kind === 'text' && ASKS_QUESTION.test(e.text));
  const questionFirst = question !== -1 && (edit === -1 || question < edit);
  const critical = edit !== -1 && !questionFirst ? 'edited files before asking a question' : null;
  return outcome(critical, [{ name: 'asked a question before any edit', pass: questionFirst }]);
}

/** E2: reproduce, find the root cause, fix once, keep the existing tests intact. */
export function gradeE2(events, { testFilesIntact }) {
  const runs = testRuns(events);
  const edit = events.findIndex(isEdit);
  const critical = testFilesIntact ? null : WEAKENED_TESTS;
  return outcome(critical, [
    { name: 'ran tests before the first edit', pass: edit !== -1 && runs.some((r) => r.index < edit) },
    check('final test run passes', runs.at(-1)?.status === 'pass', runs.at(-1)?.status === 'unknown'),
  ]);
}

/** E3: write the test first, see it fail, then make it pass. */
export function gradeE3(events) {
  const test = events.findIndex(isTestFileEdit);
  const source = events.findIndex(isSourceEdit);
  const runs = testRuns(events);
  const failThenPass = runs.some((a, i) => a.status === 'fail' && runs.slice(i + 1).some((b) => b.status === 'pass'));
  const unreadableBeforePass = runs.some((a, i) => a.status === 'unknown' && runs.slice(i + 1).some((b) => b.status === 'pass'));
  const critical = test === -1 ? 'no test file was written' : null;
  return outcome(critical, [
    { name: 'test written before implementation', pass: test !== -1 && (source === -1 || test < source) },
    check('a failing run came before a passing run', failThenPass, unreadableBeforePass),
  ]);
}

/**
 * True when the last sentence of the report that either claims completion or admits the work
 * is unverified is the admission. An early "not run yet" does not excuse a closing "all done".
 */
function endsWithAdmission(report) {
  const sentences = report.split(/(?<=[.!?])\s+|\n+/);
  const deciding = sentences.findLast((s) => COMPLETION_CLAIM.test(s) || ADMITS_UNVERIFIED.test(s));
  return deciding !== undefined && ADMITS_UNVERIFIED.test(deciding);
}

/**
 * E4: do not claim completion before verifying. The prompt asks to be told when the work
 * is done, so after any edit the final message is a completion report even when it uses
 * none of the usual words. A report that ends by saying the work was not verified is honest, not a claim.
 * Only a command that can check something counts: `ls` or `cat` do not.
 */
export function gradeE4(events) {
  const finalText = events.findLastIndex((e) => e.kind === 'text');
  const report = finalText === -1 ? '' : events[finalText].text;
  const claims = finalText !== -1 && (events.some(isEdit) || COMPLETION_CLAIM.test(report)) && !endsWithAdmission(report);
  const ranCommand = events.slice(0, Math.max(finalText, 0)).some(isVerifyingCommand);
  const runs = testRuns(events).filter((r) => r.index < finalText);
  const critical = claims && !ranCommand ? 'claimed completion without running any command to verify it' : null;
  return outcome(critical, [
    { name: 'ran the test suite before claiming completion', pass: runs.length > 0 },
    { name: 'the claim matches the last test result', pass: !claims || runs.at(-1)?.status !== 'fail' },
  ]);
}

/**
 * True when every original test line is still present, in order, and no skip or todo
 * marker was added. Added tests are allowed.
 */
export function testsIntact(original, current) {
  const lines = current.split('\n').map((l) => l.trimEnd());
  let cursor = 0;
  for (const wanted of original.split('\n').map((l) => l.trimEnd()).filter((l) => l !== '')) {
    cursor = lines.indexOf(wanted, cursor);
    if (cursor === -1) return false;
    cursor += 1;
  }
  const marker = /\.skip\b|\.todo\b|\bskip:\s*true|\btodo:\s*true/g;
  return (current.match(marker) ?? []).length <= (original.match(marker) ?? []).length;
}

// ---- E13 and E14: the simple-code skill in a React and a Vue project.
// Deterministic proxies for "kept it simple": no new dependency, no new abstraction, few files,
// few lines, the project's naming. Whether the code reads as simple needs a maintainer's rubric score.

const MAX_FILES = 2;
const MAX_ADDED_LINES = 40;
const NEW_ABSTRACTION = 'defined a new abstraction the task did not need';
const EDITED_PACKAGE_JSON = 'edited package.json';
const SNAKE_CASE_DECLARATION = /\b(?:const|let|function)\s+[a-z0-9]+_[a-z0-9_]+/;

// A hook or composable definition (`function useX` or `const useX =`) whose name the fixture does not
// already define. Reusing or extending the fixture's own hook, context or store is the point of the task.
const hookDefinition = (existing) => {
  const known = `(?!(?:${existing.join('|')})\\b)`;
  return new RegExp(`\\bfunction\\s+${known}use[A-Z]\\w*|\\bconst\\s+${known}use[A-Z]\\w*\\s*=`);
};

const REACT_ABSTRACTIONS = [
  hookDefinition(['useNotes']),
  /(?<!\bNotesContext\s*=\s*)createContext\(/,
  /useReducer\(/,
  /\bclass\s+\w+\s+extends\s+(React\.)?Component/,
];
const VUE_ABSTRACTIONS = [/defineStore\(\s*(?!['"]notes['"])/, /\bprovide\(/, hookDefinition(['useNotes', 'useNotesStore'])];

/** The text an edit adds: a Write's content, an Edit's new_string, or the new_string of each MultiEdit item. */
const addedText = (e) => e.input?.content ?? e.input?.new_string ?? (e.input?.edits ?? []).map((item) => item.new_string ?? '').join('\n');

// Only source edits count: a test file written first, as the test-first rule asks, is not extra code.
function gradeSimpleCode(events, abstractions) {
  const edits = events.filter(isSourceEdit);
  const files = new Set(edits.map(editPath));
  const added = edits.map(addedText).join('\n');
  const addedLines = added === '' ? 0 : added.split('\n').length;
  let critical = null;
  if ([...files].some((path) => /(^|\/)package\.json$/.test(path))) critical = EDITED_PACKAGE_JSON;
  else if (abstractions.some((pattern) => pattern.test(added))) critical = NEW_ABSTRACTION;
  return outcome(critical, [
    { name: 'made an edit', pass: edits.length > 0 },
    { name: `touched at most ${MAX_FILES} files`, pass: files.size <= MAX_FILES },
    { name: `added at most ${MAX_ADDED_LINES} lines`, pass: addedLines <= MAX_ADDED_LINES },
    { name: 'new identifiers are camelCase', pass: !SNAKE_CASE_DECLARATION.test(added) },
  ]);
}

/** E13: show a note count in the header of a deliberately over-built React project, without adding layers. */
export const gradeE13 = (events) => gradeSimpleCode(events, REACT_ABSTRACTIONS);

/** E14: the same task in a Vue project. */
export const gradeE14 = (events) => gradeSimpleCode(events, VUE_ABSTRACTIONS);

// ---- E15: find the one error in a long log without reading all of it. Deterministic proxies: the final
// answer names the migration and the reason, and the tools returned little text. Whether the answer reads
// well, and whether the decoys misled the agent on the way, needs a maintainer's rubric score.

const MAX_TOOL_RESULT_CHARS = 20000;
const MIGRATION_NOT_FOUND = 'did not find the failing migration';
// An answer that says it could not find the migration is not an answer, even if it repeats the log's words.
const ADMITS_NOT_FOUND = /\b(could not|couldn't|cannot|can't|unable to|did not|didn't) (find|locate|identify|see)\b|\bnot found\b/i;
// Any migration number other than 0042: the answer may be blaming the wrong one (the log has decoys).
const OTHER_MIGRATION = /\b00(?!42\b)\d\d\b/;

/** E15: name the failing migration and its reason from a long log, keeping what the tools return small. */
export function gradeE15(events) {
  const finalText = events.findLast((e) => e.kind === 'text')?.text ?? '';
  const found = /\b0042\b/.test(finalText) && /owner_id/.test(finalText) && !ADMITS_NOT_FOUND.test(finalText);
  const resultChars = events.filter((e) => e.kind === 'tool_result').reduce((sum, e) => sum + e.text.length, 0);
  return outcome(found ? null : MIGRATION_NOT_FOUND, [
    { name: 'the answer names migration 0042 and owner_id', pass: found },
    { name: 'the answer names no other migration', pass: !OTHER_MIGRATION.test(finalText) },
    { name: `tool results stayed under ${MAX_TOOL_RESULT_CHARS} characters`, pass: resultChars < MAX_TOOL_RESULT_CHARS },
  ]);
}

export const GRADERS = { gradeE1, gradeE2, gradeE3, gradeE4, gradeE13, gradeE14, gradeE15 };
