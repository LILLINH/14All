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

/** Parse `claude -p --output-format stream-json --verbose` output into an ordered list of events. */
export function parseStream(raw) {
  const events = [];
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
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
