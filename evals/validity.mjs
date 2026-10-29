// Decide whether a saved run measured the agent at all. A run that died before the agent did
// anything (not signed in, out of quota, timeout, no `claude` binary) must not be graded as a
// failure: it would count against the baseline and flatter the plugin.

import { parseJsonLines, parseStream, resultMessage } from './parse-stream.mjs';

/** The marker the 14All bootstrap skill carries; the SessionStart hook injects it with the skill. */
export const BOOTSTRAP_MARKER = '14ALL-BOOTSTRAP-V1';

/** True when a SessionStart hook response in the transcript carries the bootstrap. */
const bootstrapLoaded = (raw) =>
  parseJsonLines(raw).some(
    (m) => m?.type === 'system' && m.subtype === 'hook_response' && m.hook_event === 'SessionStart' && typeof m.output === 'string' && m.output.includes(BOOTSTRAP_MARKER),
  );

/**
 * Why the run is not valid, or null when it is. With a `mode`, the transcript must also prove it: the
 * 14all mode shows the bootstrap from the plugin's SessionStart hook, the baseline mode does not.
 */
export function invalidReason({ exitStatus, raw, mode }) {
  if (exitStatus !== 0) return `claude did not exit cleanly (exit status ${exitStatus ?? 'none: killed or timed out'})`;
  if (parseStream(raw).length === 0) return 'the transcript has no events';
  const result = resultMessage(raw);
  if (!result) return 'the transcript has no result message';
  if (result.is_error) return `claude reported an error (${result.subtype ?? 'unknown'})`;
  if (mode === '14all' && !bootstrapLoaded(raw)) return 'the 14all plugin did not load: no SessionStart hook response carries the bootstrap';
  if (mode === 'baseline' && bootstrapLoaded(raw)) return 'the baseline run had the 14all plugin loaded';
  return null;
}
