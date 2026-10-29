import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseSkillFile } from './frontmatter.mjs';

const MAX_LINES = 120;
const MAX_DESCRIPTION = 1024;
/** The only tools an agent may have: it reads, and Bash is for reading too (git diff, git log, a test run). */
export const ALLOWED_TOOLS = ['Read', 'Glob', 'Grep', 'Bash'];
const ALLOWED_KEYS = ['name', 'description', 'tools'];

/** The tool names of a `tools` value written as a comma-separated string or as a YAML list. */
function toolList(value) {
  if (Array.isArray(value)) return value.map((tool) => String(tool).trim());
  if (typeof value === 'string') return value.split(',').map((tool) => tool.trim()).filter((tool) => tool !== '');
  return [];
}

/** Problems with one agent file, each prefixed with the file name. */
export function lintAgentFile(path) {
  const file = basename(path);
  const problems = [];
  const add = (message) => problems.push(`${file}: ${message}`);

  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return [`${file}: cannot be read`];
  }
  let frontmatter;
  try {
    ({ frontmatter } = parseSkillFile(text));
  } catch (err) {
    return [`${file}: ${err.message}`];
  }

  if (frontmatter.name !== basename(path, '.md')) add(`name must equal the file name, got "${frontmatter.name}"`);
  const { description } = frontmatter;
  if (typeof description !== 'string' || !description.startsWith('Use when')) add('description must start with "Use when"');
  else if (description.length > MAX_DESCRIPTION) add(`description is ${description.length} characters; the limit is ${MAX_DESCRIPTION}`);

  const tools = toolList(frontmatter.tools);
  if (tools.length === 0) add('tools is required and must list at least one tool');
  for (const tool of tools) {
    if (!ALLOWED_TOOLS.includes(tool)) add(`tools: ${tool} is not allowed (an agent may use only ${ALLOWED_TOOLS.join(', ')})`);
  }
  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_KEYS.includes(key)) add(`unknown key "${key}" (an agent has only ${ALLOWED_KEYS.join(', ')}; the dispatcher sets the model)`);
  }

  const lines = text.split('\n').length;
  if (lines > MAX_LINES) add(`has ${lines} lines; the limit is ${MAX_LINES}`);
  return problems;
}

/** Problems with every .md file directly under root. A missing root has none; other entries are ignored. */
export function lintAgentsRoot(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()
    .flatMap((name) => lintAgentFile(join(root, name)));
}
