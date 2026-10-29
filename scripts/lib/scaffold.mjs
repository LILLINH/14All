import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Create <skillsRoot>/<name>/ with a SKILL.md and meta.yaml that pass the lint. Returns the directory. */
export function scaffoldSkill(skillsRoot, name, { owner = 'OWNER', date = new Date().toISOString().slice(0, 10) } = {}) {
  if (!NAME.test(name) || name.length > 64) {
    throw new Error(`skill name "${name}" must be lowercase letters, digits and hyphens, at most 64 characters`);
  }
  const dir = join(skillsRoot, name);
  if (existsSync(dir)) throw new Error(`skill "${name}" already exists`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    `---
name: ${name}
description: Use when TODO, one sentence naming the situation that should trigger this skill.
---

# ${name}

TODO: what the agent does, as steps it can follow. Name actions, not tool names. Keep it under 400 lines.
`,
  );
  writeFileSync(
    join(dir, 'meta.yaml'),
    `class: original
sources: []
changed:
  made: false
  summary: ""
maturity: draft
adapters_tested: []
owner: ${owner}
last_reviewed: ${date}
`,
  );
  return dir;
}
