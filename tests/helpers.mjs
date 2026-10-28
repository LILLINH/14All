import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function makeRoot() {
  return mkdtempSync(join(tmpdir(), '14all-test-'));
}

export const VALID_META_YAML = `class: original
sources: []
changed:
  made: false
  summary: ""
maturity: draft
adapters_tested: []
owner: OWNER
last_reviewed: 2026-10-28
`;

export const ADAPTED_META_YAML = `class: adapted
sources:
  - repo: obra/superpowers
    ref: v1.0.0
    license: MIT
    path: skills/demo
changed:
  made: true
  summary: merged with another source
maturity: draft
adapters_tested: []
owner: OWNER
last_reviewed: 2026-10-28
`;

export const validSkillMd = (name) =>
  `---\nname: ${name}\ndescription: Use when testing ${name}.\n---\n# ${name}\n`;

/** Create <root>/<name>/SKILL.md and meta.yaml; pass null to omit a file. */
export function writeSkill(root, name, { skill = validSkillMd(name), meta = VALID_META_YAML } = {}) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  if (skill !== null) writeFileSync(join(dir, 'SKILL.md'), skill);
  if (meta !== null) writeFileSync(join(dir, 'meta.yaml'), meta);
  return dir;
}
