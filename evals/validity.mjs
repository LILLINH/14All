// Decide whether a saved run measured the agent at all. A run that died before the agent did
// anything (not signed in, out of quota, timeout, no `claude` binary) must not be graded as a
// failure: it would count against the baseline and flatter the plugin.

import { parseStream, resultMessage } from './parse-stream.mjs';

/** Why the run is not valid, or null when it is. */
export function invalidReason({ exitStatus, raw }) {
  if (exitStatus !== 0) return `claude did not exit cleanly (exit status ${exitStatus ?? 'none: killed or timed out'})`;
  if (parseStream(raw).length === 0) return 'the transcript has no events';
  const result = resultMessage(raw);
  if (!result) return 'the transcript has no result message';
  if (result.is_error) return `claude reported an error (${result.subtype ?? 'unknown'})`;
  return null;
}
