import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { parseSkillFile } from './frontmatter.mjs';
import { validateMeta } from './meta.mjs';
import { listSkillDirs, MAX_SKILL_NAME, SKILL_NAME } from './skills.mjs';
import { crossCheckSkillSources } from './sources.mjs';

const MAX_LINES = 400;
const MAX_DESCRIPTION = 1024;
const ALLOWED_KEYS = ['name', 'description'];

/** True when the description line is a plain (unquoted) scalar that contains " #". */
function descriptionHasYamlComment(frontmatterText) {
  const line = frontmatterText.split('\n').find((l) => l.startsWith('description:'));
  if (line === undefined) return false;
  const value = line.slice('description:'.length).trim();
  return !/^["'|>]/.test(value) && /\s#/.test(value);
}

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

function nameProblem(name, dirName) {
  if (typeof name !== 'string' || name !== dirName) return `name "${name}" must equal the directory name "${dirName}"`;
  if (!SKILL_NAME.test(name)) return `name "${name}" must be lowercase letters, digits and hyphens`;
  if (name.length > MAX_SKILL_NAME) return `name is ${name.length} characters (max ${MAX_SKILL_NAME})`;
  return null;
}

function descriptionProblem(description) {
  if (typeof description !== 'string' || description.trim() === '') return 'description must not be empty';
  if (description.length > MAX_DESCRIPTION) return `description is ${description.length} characters (max ${MAX_DESCRIPTION})`;
  return null;
}

function skillFileProblems(skillPath, dirName) {
  if (!existsSync(skillPath)) return ['SKILL.md is missing'];
  const text = readFileSync(skillPath, 'utf8');
  const problems = [];
  const lines = text.replace(/\n$/, '').split('\n').length;
  if (lines > MAX_LINES) problems.push(`SKILL.md has ${lines} lines (max ${MAX_LINES})`);
  try {
    const { frontmatter, frontmatterText } = parseSkillFile(text);
    if (descriptionHasYamlComment(frontmatterText)) {
      problems.push('description has an unquoted " #", which YAML reads as a comment and cuts the description short; quote it');
    }
    problems.push(nameProblem(frontmatter.name, dirName), descriptionProblem(frontmatter.description));
    for (const key of Object.keys(frontmatter)) {
      if (!ALLOWED_KEYS.includes(key)) problems.push(`extra key "${key}" in frontmatter`);
    }
  } catch (err) {
    problems.push(`frontmatter: ${err.message}`);
  }
  return problems.filter(Boolean);
}

function metaFileProblems(metaPath, sources) {
  if (!existsSync(metaPath)) return ['meta.yaml is missing'];
  try {
    const meta = parse(readFileSync(metaPath, 'utf8'));
    const problems = validateMeta(meta);
    if (sources && Array.isArray(meta?.sources)) problems.push(...crossCheckSkillSources(meta.sources, sources));
    return problems.map((msg) => `meta.yaml: ${msg}`);
  } catch (err) {
    return [`meta.yaml is not valid YAML: ${err.message.split('\n')[0]}`];
  }
}

/**
 * Lint one skill directory. Returns a list of problems; empty means valid.
 * Pass the parsed upstream/sources.json as `sources` to also check that every cited source is pinned.
 */
export function lintSkillDir(skillDir, { sources } = {}) {
  const dir = resolve(skillDir);
  const dirName = basename(dir);
  if (lstatSync(dir).isSymbolicLink()) return [`${dirName}: symlink skill directories are not allowed`];

  const problems = [
    ...symlinkProblems(dir, realpathSync(dirname(dir))),
    ...skillFileProblems(join(dir, 'SKILL.md'), dirName),
    ...metaFileProblems(join(dir, 'meta.yaml'), sources),
  ];
  return problems.map((msg) => `${dirName}: ${msg}`);
}

/** Lint every skill directory directly under skillsRoot. A missing root has no skills. */
export function lintSkillsRoot(skillsRoot, options = {}) {
  return listSkillDirs(skillsRoot).flatMap((name) => lintSkillDir(join(skillsRoot, name), options));
}
