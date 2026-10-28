const FIELDS = ['id', 'repo', 'ref', 'commit', 'licenseFile', 'license'];
const LICENSES = ['MIT', 'Apache-2.0'];

/**
 * Validate upstream/sources.json. Every entry must have a LICENSE file at the pinned
 * commit; a source without one is link-only and does not belong in this list.
 */
export function validateSources(data) {
  if (!Array.isArray(data)) return ['sources must be a list'];
  const problems = [];
  data.forEach((entry, i) => {
    const label = entry?.id ?? `#${i}`;
    for (const field of FIELDS) {
      if (typeof entry?.[field] !== 'string' || entry[field].trim() === '') {
        problems.push(`${label}: ${field} is required`);
      }
    }
    if (typeof entry?.commit === 'string' && entry.commit !== '' && !/^[0-9a-f]{40}$/.test(entry.commit)) {
      problems.push(`${label}: commit must be 40 hex characters`);
    }
    if (typeof entry?.license === 'string' && entry.license !== '' && !LICENSES.includes(entry.license)) {
      problems.push(`${label}: license "${entry.license}" must be one of ${LICENSES.join(', ')}`);
    }
  });
  return problems;
}
