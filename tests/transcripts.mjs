// Builders for hand-written transcripts (arrays of Event) used by the grader tests.

export const text = (t) => ({ kind: 'text', text: t });
export const edit = (path, id, name = 'Write') => ({ kind: 'tool_use', id, name, input: { file_path: path } });
export const bash = (command, id) => ({ kind: 'tool_use', id, name: 'Bash', input: { command } });
export const result = (toolUseId, t) => ({ kind: 'tool_result', toolUseId, text: t });

export const PASS_OUTPUT = '# tests 3\n# pass 3\n# fail 0\n';
export const FAIL_OUTPUT = '# tests 3\n# pass 2\n# fail 1\n';
