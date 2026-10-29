/**
 * Event shape shared by the graders.
 * kind 'text'        : { text }                      assistant prose
 * kind 'tool_use'    : { id, name, input }           a tool call
 * kind 'tool_result' : { toolUseId, text }           the tool's output
 */

const flatten = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('');
  return '';
};

/** The JSON objects of a JSON-lines transcript; blank and unparsable lines are skipped. */
export function parseJsonLines(raw) {
  return raw.split('\n').flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

/** The final `result` message of a transcript, or undefined when the run never produced one. */
export const resultMessage = (raw) => parseJsonLines(raw).findLast((message) => message?.type === 'result');

/** Parse `claude -p --output-format stream-json --verbose` output into an ordered list of events. */
export function parseStream(raw) {
  const events = [];
  for (const message of parseJsonLines(raw)) {
    // Messages produced inside a subagent carry the id of the tool call that started it.
    // They are not the main agent's actions, so they are left out of the grade.
    if (message?.parent_tool_use_id) continue;
    const content = message?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (message.type === 'assistant' && item.type === 'text') {
        events.push({ kind: 'text', text: item.text });
      } else if (message.type === 'assistant' && item.type === 'tool_use') {
        events.push({ kind: 'tool_use', id: item.id, name: item.name, input: item.input });
      } else if (message.type === 'user' && item.type === 'tool_result') {
        events.push({ kind: 'tool_result', toolUseId: item.tool_use_id, text: flatten(item.content) });
      }
    }
  }
  return events;
}
