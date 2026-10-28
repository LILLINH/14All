import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { parseSkillFile } from './frontmatter.mjs';
import { validateMeta } from './meta.mjs';

const MAX_LINES = 400;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const ALLOWED_KEYS = ['name', 'description'];

function symlinkProblems(dir, root) {
  const problems = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) {
        let target;
        try {
          target = realpathSync(path);
        } catch {
          problems.push(`symlink "${relative(dir, path)}" is broken`);
          continue;
        }
        if (!target.startsWith(root + sep)) {
          problems.push(`symlink "${relative(dir, path)}" points outside the skills root`);
        }
      } else if (stat.isDirectory()) {
        walk(path);
      }
    }
  };
  walk(dir);
  return problems;
}

/** Lint one skill directory. Returns a list of problems; empty means valid. */
export function lintSkillDir(skillDir) {
  const dir = resolve(skillDir);
  const dirName = basename(dir);
  const problems = [];
  const add = (msg) => problems.push(`${dirName}: ${msg}`);

  if (lstatSync(dir).isSymbolicLink()) {
    add('symlink skill directories are not allowed');
    return problems;
  }

  const root = realpathSync(dirname(dir));
  for (const msg of symlinkProblems(dir, root)) add(msg);

  const skillPath = join(dir, 'SKILL.md');
  if (!existsSync(skillPath)) {
    add('SKILL.md is missing');
  } else {
    const text = readFileSync(skillPath, 'utf8');
    const lines = text.replace(/\n$/, '').split('\n').length;
    if (lines > MAX_LINES) add(`SKILL.md has ${lines} lines (max ${MAX_LINES})`);
    try {
      const { frontmatter } = parseSkillFile(text);
      const { name, description } = frontmatter;
      if (typeof name !== 'string' || name !== dirName) {
        add(`name "${name}" must equal the directory name "${dirName}"`);
      } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        add(`name "${name}" must be lowercase letters, digits and hyphens`);
      } else if (name.length > MAX_NAME) {
        add(`name is ${name.length} characters (max ${MAX_NAME})`);
      }
      if (typeof description !== 'string' || description.trim() === '') {
        add('description must not be empty');
      } else if (description.length > MAX_DESCRIPTION) {
        add(`description is ${description.length} characters (max ${MAX_DESCRIPTION})`);
      }
      for (const key of Object.keys(frontmatter)) {
        if (!ALLOWED_KEYS.includes(key)) add(`extra key "${key}" in frontmatter`);
      }
    } catch (err) {
      add(`frontmatter: ${err.message}`);
    }
  }

  const metaPath = join(dir, 'meta.yaml');
  if (!existsSync(metaPath)) {
    add('meta.yaml is missing');
  } else {
    try {
      for (const msg of validateMeta(parse(readFileSync(metaPath, 'utf8')))) add(`meta.yaml: ${msg}`);
    } catch (err) {
      add(`meta.yaml is not valid YAML: ${err.message.split('\n')[0]}`);
    }
  }

  return problems;
}

/** Lint every skill directory directly under skillsRoot. A missing root has no skills. */
export function lintSkillsRoot(skillsRoot) {
  if (!existsSync(skillsRoot)) return [];
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.') && (e.isDirectory() || e.isSymbolicLink()))
    .flatMap((e) => lintSkillDir(join(skillsRoot, e.name)));
}
