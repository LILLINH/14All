const UNITS = { s: 1, m: 60, h: 3600 };

// Parses a single-unit duration such as "90s" or "5m" into seconds.
export function parseDuration(text) {
  const match = /^(\d+)([smh])$/.exec(text);
  if (!match) throw new Error(`invalid duration: ${text}`);
  return Number(match[1]) * UNITS[match[2]];
}
