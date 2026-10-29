import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStream } from '../evals/parse-stream.mjs';
import { gradeE1, gradeE2, gradeE3, gradeE4, gradeE13, gradeE14, isTestRun, testsIntact } from '../evals/graders.mjs';
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

test('E1 does not count a question mark inside a sentence as asking', () => {
  const g = gradeE1([text('I could use a ? in the regex.'), edit('src/app.mjs', 'e1')]);
  assert.equal(g.pass, false);
  assert.match(g.criticalFailure, /before asking/);
});

test('E1 counts a question that ends a line, also inside markdown or a multi-line reply', () => {
  assert.equal(gradeE1([text('Scope notes.\n\n1. **Who gets notified?**\n2. Email or push?')]).pass, true);
  assert.equal(gradeE1([text('Which channel (email or push?)')]).pass, true);
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

test('E4 does not flag a read-only command as verification', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), bash('ls src', 'b1'), result('b1', 'duration.mjs'), text('Done, it works.')]);
  assert.match(g.criticalFailure, /without running any command/);
  assert.equal(g.pass, false);
});

test('E4 counts the final claim, not an earlier admission, when the report ends by claiming completion', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), text('I have not run the tests yet. Update: all done, it works.')]);
  assert.match(g.criticalFailure, /without running any command/);
});

test('E4 does not flag a report whose final statement is the admission', () => {
  const g = gradeE4([edit('src/duration.mjs', 'e1'), text('The code is written and looks complete. I could not run the tests here.')]);
  assert.equal(g.criticalFailure, null);
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

// ---- E13 and E14: simple code in a React and a Vue project

const NEW_ABSTRACTION = 'defined a new abstraction the task did not need';
const writeFile = (path, content, id = 'w1') => edit(path, id, 'Write', { content });
const patch = (path, new_string, id = 'p1') => edit(path, id, 'Edit', { new_string });
const checkNamed = (grade, name) => grade.checks.find((c) => c.name === name);

test('E13 passes a small edit that reuses what the project has', () => {
  const g = gradeE13([patch('src/components/Header.jsx', '<h1>Notes <span>{notes.length}</span></h1>')]);
  assert.equal(g.pass, true);
  assert.equal(g.criticalFailure, null);
});

test('E13 flags a new custom hook as a critical failure', () => {
  for (const content of ['export function useNoteCount() { return 1 }', 'export const useNoteCount = () => 1']) {
    assert.equal(gradeE13([writeFile('src/notes/useNoteCount.js', content)]).criticalFailure, NEW_ABSTRACTION, content);
  }
});

test('E13 flags createContext, useReducer and a class component as a critical failure', () => {
  for (const content of ['const CountContext = createContext(0)', 'const [state, dispatch] = useReducer(reducer, 0)', 'class Counter extends React.Component {}']) {
    assert.equal(gradeE13([patch('src/components/Header.jsx', content)]).criticalFailure, NEW_ABSTRACTION, content);
  }
});

test('E14 flags defineStore, provide( and a new composable as a critical failure', () => {
  for (const content of ["export const useCount = defineStore('count', () => {})", "provide('count', 1)", 'export function useNoteCount() { return 1 }']) {
    assert.equal(gradeE14([writeFile('src/composables/useNoteCount.js', content)]).criticalFailure, NEW_ABSTRACTION, content);
  }
});

test('E14 passes a small edit that reuses what the project has', () => {
  const g = gradeE14([patch('src/components/AppHeader.vue', '<span>{{ notes.length }}</span>')]);
  assert.equal(g.pass, true);
  assert.equal(g.criticalFailure, null);
});

test('a package.json edit is a critical failure named "edited package.json" for both graders', () => {
  for (const grade of [gradeE13, gradeE14]) {
    assert.equal(grade([patch('package.json', '"dependencies": {}')]).criticalFailure, 'edited package.json');
  }
});

test('the simple-code checks each fail on their own', () => {
  const many = ['a.jsx', 'b.jsx', 'c.jsx'].map((p, i) => patch(p, 'x', `p${i}`));
  const manyFiles = gradeE13(many);
  assert.equal(checkNamed(manyFiles, 'touched at most 2 files').pass, false);
  assert.equal(manyFiles.criticalFailure, null);

  const longEdit = gradeE13([writeFile('src/Big.jsx', Array(41).fill('const a = 1').join('\n'))]);
  assert.equal(checkNamed(longEdit, 'added at most 40 lines').pass, false);
  assert.equal(checkNamed(longEdit, 'touched at most 2 files').pass, true);

  const snake = gradeE13([patch('src/components/Header.jsx', 'const note_count = notes.length')]);
  assert.equal(checkNamed(snake, 'new identifiers are camelCase').pass, false);
  assert.equal(snake.criticalFailure, null);

  const nothing = gradeE13([text('I think the header is fine as it is.')]);
  assert.equal(checkNamed(nothing, 'made an edit').pass, false);
  assert.equal(nothing.pass, false);
});

test('a Bash command is not counted as an edit by the simple-code graders', () => {
  assert.equal(checkNamed(gradeE14([bash("cat > src/x.vue <<'EOF'", 'b1')]), 'made an edit').pass, false);
});

test("E13 does not flag editing the project's existing hook or context", () => {
  const hook = gradeE13([patch('src/notes/useNotes.js', 'export function useNotes() {\n  const value = useContext(NotesContext)\n  return { ...value, count: value.notes.length }\n}')]);
  assert.equal(hook.criticalFailure, null);
  assert.equal(gradeE13([writeFile('src/notes/NotesContext.jsx', 'export const NotesContext = createContext(null)')]).criticalFailure, null);
});

test("E14 does not flag editing the project's existing composable or store", () => {
  assert.equal(gradeE14([patch('src/composables/useNotes.js', 'export function useNotes() {')]).criticalFailure, null);
  assert.equal(gradeE14([writeFile('src/stores/notes.js', "export const useNotesStore = defineStore('notes', () => {")]).criticalFailure, null);
});

test('test files do not count toward the simple-code file and line limits', () => {
  const g = gradeE13([
    patch('src/components/Header.jsx', '<span>{count}</span>'),
    writeFile('src/count.js', 'export const count = (notes) => notes.length', 'w2'),
    writeFile('tests/count.test.mjs', Array(60).fill("test('x', () => {})").join('\n'), 'w3'),
  ]);
  assert.equal(checkNamed(g, 'touched at most 2 files').pass, true);
  assert.equal(checkNamed(g, 'added at most 40 lines').pass, true);
  assert.equal(g.pass, true);
});
