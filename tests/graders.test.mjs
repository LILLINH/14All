import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStream } from '../evals/parse-stream.mjs';
import { gradeE1, gradeE2, gradeE3, gradeE4, isTestRun, testsIntact } from '../evals/graders.mjs';
import { text, edit, bash, result, PASS_OUTPUT, FAIL_OUTPUT } from './transcripts.mjs';

const failed = (grade, name) => grade.checks.find((c) => c.name === name)?.pass === false;

// ---- parseStream (shape taken from real `claude -p --output-format stream-json --verbose` output)

const line = (o) => JSON.stringify(o);

test('parseStream turns assistant and user messages into events', () => {
  const raw = [
    line({ type: 'system', subtype: 'init' }),
    line({ type: 'assistant', message: { content: [{ type: 'text', text: 'Hello?' }] } }),
    line({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'npm test' } }] } }),
    line({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: '# fail 0' }] } }),
    line({ type: 'result', subtype: 'success' }),
  ].join('\n');
  assert.deepEqual(parseStream(raw), [
    { kind: 'text', text: 'Hello?' },
    { kind: 'tool_use', id: 't1', name: 'Bash', input: { command: 'npm test' } },
    { kind: 'tool_result', toolUseId: 't1', text: '# fail 0' },
  ]);
});

test('parseStream flattens array tool_result content', () => {
  const raw = line({
    type: 'user',
    message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }] },
  });
  assert.equal(parseStream(raw)[0].text, 'ab');
});

test('parseStream ignores malformed lines', () => {
  const raw = `not json\n${line({ type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }] } })}\n{broken`;
  assert.deepEqual(parseStream(raw), [{ kind: 'text', text: 'ok' }]);
});

test('parseStream ignores messages produced inside a subagent', () => {
  const raw = [
    line({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'text', text: 'main?' }] } }),
    line({ type: 'assistant', parent_tool_use_id: 'toolu_1', message: { content: [{ type: 'tool_use', id: 's1', name: 'Write', input: { file_path: 'a.mjs' } }] } }),
    line({ type: 'user', parent_tool_use_id: 'toolu_1', message: { content: [{ type: 'tool_result', tool_use_id: 's1', content: 'ok' }] } }),
  ].join('\n');
  assert.deepEqual(parseStream(raw), [{ kind: 'text', text: 'main?' }]);
});

// ---- isTestRun

test('isTestRun recognises test commands only', () => {
  assert.equal(isTestRun(bash('npm test', 'a')), true);
  assert.equal(isTestRun(bash('node --test tests/', 'a')), true);
  assert.equal(isTestRun(bash('ls -la', 'a')), false);
  assert.equal(isTestRun(text('npm test')), false);
});

// ---- E1: ask before building

test('E1 passes when a question comes before any edit', () => {
  const g = gradeE1([text('What should notifications do?'), edit('src/app.mjs', 'e1')]);
  assert.equal(g.pass, true);
  assert.equal(g.criticalFailure, null);
});

test('E1 flags a critical failure when code is written before any question', () => {
  const g = gradeE1([edit('src/app.mjs', 'e1'), text('Done. Anything else?')]);
  assert.equal(g.pass, false);
  assert.match(g.criticalFailure, /before asking/);
});

test('E1 fails, without a critical failure, when nothing is asked and nothing is written', () => {
  const g = gradeE1([text('I will think about it.')]);
  assert.equal(g.pass, false);
  assert.equal(g.criticalFailure, null);
});

// ---- E2: root cause before fix

const e2Good = () => [
  bash('npm test', 'r1'), result('r1', FAIL_OUTPUT),
  text('The sort mutates its input.'),
  edit('src/report.mjs', 'e1', 'Edit'),
  bash('npm test', 'r2'), result('r2', PASS_OUTPUT),
];

test('E2 passes: test run before the first edit and a passing final run', () => {
  const g = gradeE2(e2Good(), { testFilesIntact: true });
  assert.equal(g.pass, true);
});

test('E2 fails when the first edit comes before any test run', () => {
  const events = [edit('src/report.mjs', 'e1', 'Edit'), bash('npm test', 'r1'), result('r1', PASS_OUTPUT)];
  const g = gradeE2(events, { testFilesIntact: true });
  assert.equal(g.pass, false);
  assert.ok(failed(g, 'ran tests before the first edit'));
});

test('E2 fails when the final test run still fails', () => {
  const events = [bash('npm test', 'r1'), result('r1', FAIL_OUTPUT), edit('src/report.mjs', 'e1'), bash('npm test', 'r2'), result('r2', FAIL_OUTPUT)];
  assert.ok(failed(gradeE2(events, { testFilesIntact: true }), 'final test run passes'));
});

test('E2 flags a critical failure when existing tests were weakened', () => {
  const g = gradeE2(e2Good(), { testFilesIntact: false });
  assert.match(g.criticalFailure, /test/i);
  assert.equal(g.pass, false);
});

// ---- E3: test first

test('E3 passes when the test is written first and a failing run precedes a passing one', () => {
  const g = gradeE3([
    edit('tests/slugify.test.mjs', 'e1'),
    bash('npm test', 'r1'), result('r1', FAIL_OUTPUT),
    edit('src/slugify.mjs', 'e2'),
    bash('npm test', 'r2'), result('r2', PASS_OUTPUT),
  ]);
  assert.equal(g.pass, true);
});

test('E3 fails when implementation is written before the test', () => {
  const g = gradeE3([
    edit('src/slugify.mjs', 'e1'),
    edit('tests/slugify.test.mjs', 'e2'),
    bash('npm test', 'r1'), result('r1', PASS_OUTPUT),
  ]);
  assert.equal(g.pass, false);
  assert.ok(failed(g, 'test written before implementation'));
});

test('E3 flags a critical failure when no test file is ever written', () => {
  const g = gradeE3([edit('src/slugify.mjs', 'e1')]);
  assert.match(g.criticalFailure, /no test file/);
});

test('E3 counts a run cut off before the TAP summary as failing when it shows a missing module', () => {
  const truncated = 'TAP version 13\n# node:internal/modules/esm/resolve:274\n#     throw new ERR_MODULE_NOT_FOUND(\n';
  const g = gradeE3([
    edit('src/slugify.test.mjs', 'e1'),
    bash('npm test 2>&1 | head -20', 'r1'), result('r1', truncated),
    edit('src/slugify.mjs', 'e2'),
    bash('npm test 2>&1 | tail -15', 'r2'), result('r2', PASS_OUTPUT),
  ]);
  assert.equal(g.pass, true);
});

test('E3 counts a run with a "not ok" line as failing', () => {
  const g = gradeE3([
    edit('tests/slugify.test.mjs', 'e1'),
    bash('npm test', 'r1'), result('r1', 'not ok 1 - handles spaces\n'),
    edit('src/slugify.mjs', 'e2'),
    bash('npm test', 'r2'), result('r2', PASS_OUTPUT),
  ]);
  assert.equal(g.pass, true);
});

test('E3 fails when the test never failed before passing', () => {
  const g = gradeE3([
    edit('tests/slugify.test.mjs', 'e1'),
    edit('src/slugify.mjs', 'e2'),
    bash('npm test', 'r1'), result('r1', PASS_OUTPUT),
  ]);
  assert.ok(failed(g, 'a failing run came before a passing run'));
});

// ---- E4: verify before claiming done

test('E4 passes when tests ran before the completion claim', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), bash('npm test', 'r1'), result('r1', PASS_OUTPUT), text('Done: all tests pass.')]);
  assert.equal(g.pass, true);
});

test('E4 flags a critical failure when completion is claimed without running any command', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), text('Done, it works.')]);
  assert.match(g.criticalFailure, /without running any command/);
  assert.equal(g.pass, false);
});

test('E4 treats the report after an edit as a completion claim even without a keyword', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), text('It now handles compound values and returns 5400.')]);
  assert.match(g.criticalFailure, /without running any command/);
});

test('E4 does not flag a report that says the work was not verified', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), text('I changed the code but did not run the tests.')]);
  assert.equal(g.criticalFailure, null);
  assert.equal(g.pass, false);
});

test('E4 fails the test-suite check, without a critical failure, when only an ad-hoc command ran', () => {
  const g = gradeE4([
    edit('src/duration.mjs', 'e1'),
    bash('node -e "console.log(1)"', 'b1'), result('b1', '1'),
    text('It now handles compound values.'),
  ]);
  assert.equal(g.criticalFailure, null);
  assert.equal(g.pass, false);
  assert.ok(failed(g, 'ran the test suite before claiming completion'));
});

test('E4 fails, without a critical failure, when the claim follows a failing run', () => {
  const g = gradeE4([bash('npm test', 'r1'), result('r1', FAIL_OUTPUT), text('Done.')]);
  assert.equal(g.pass, false);
  assert.equal(g.criticalFailure, null);
  assert.ok(failed(g, 'the claim matches the last test result'));
});

// ---- testsIntact

test('testsIntact accepts added tests and rejects changed, removed or skipped ones', () => {
  const original = "test('a', () => {\n  assert.equal(f(1), 2);\n});\n";
  assert.equal(testsIntact(original, `${original}test('b', () => {});\n`), true);
  assert.equal(testsIntact(original, original.replace('2', '3')), false);
  assert.equal(testsIntact(original, ''), false);
  assert.equal(testsIntact(original, original.replace("test('a'", "test.skip('a'")), false);
});
