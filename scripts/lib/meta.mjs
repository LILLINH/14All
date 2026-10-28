const CLASSES = ['original', 'adapted', 'referenced'];
const MATURITY = ['draft', 'schema-valid', 'tested', 'verified'];
const LICENSES = ['MIT', 'Apache-2.0'];
const SOURCE_FIELDS = ['repo', 'ref', 'license', 'path'];

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

/** Validate a parsed meta.yaml. Returns a list of problems; empty means valid. */
export function validateMeta(meta) {
  if (!isObject(meta)) return ['meta: expected a mapping'];
  const problems = [];

  if (!CLASSES.includes(meta.class)) problems.push(`class must be one of ${CLASSES.join(', ')}`);
  if (!MATURITY.includes(meta.maturity)) problems.push(`maturity must be one of ${MATURITY.join(', ')}`);
  if (!isText(meta.owner)) problems.push('owner is required');
  if (typeof meta.last_reviewed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(meta.last_reviewed)) {
    problems.push('last_reviewed must be a YYYY-MM-DD string');
  }
  if (!Array.isArray(meta.adapters_tested)) problems.push('adapters_tested must be a list');

  if (!isObject(meta.changed) || typeof meta.changed.made !== 'boolean' || typeof meta.changed.summary !== 'string') {
    problems.push('changed must have a boolean made and a string summary');
  }

  if (!Array.isArray(meta.sources)) {
    problems.push('sources must be a list');
  } else {
    meta.sources.forEach((source, i) => {
      if (!isObject(source)) {
        problems.push(`sources[${i}] must be a mapping`);
        return;
      }
      for (const field of SOURCE_FIELDS) {
        if (!isText(source[field])) problems.push(`sources[${i}]: ${field} is required`);
      }
      if (isText(source.license) && !LICENSES.includes(source.license)) {
        problems.push(`sources[${i}]: license "${source.license}" must be one of ${LICENSES.join(', ')}`);
      }
    });
  }

  if (meta.class === 'adapted') {
    if (!Array.isArray(meta.sources) || meta.sources.length === 0) {
      problems.push('adapted skills require non-empty sources');
    }
    if (isObject(meta.changed) && meta.changed.made !== true) {
      problems.push('changed.made must be true for adapted skills');
    }
  }

  return problems;
}
