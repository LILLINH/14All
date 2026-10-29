import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { lintSkillDir } from '../scripts/lib/lint.mjs';

const dir = fileURLToPath(new URL('../skills/simple-code', import.meta.url));
const text = () => readFileSync(join(dir, 'SKILL.md'), 'utf8');

const STEP_TITLES = [
  'Scale the effort',
  'Find what you are in',
  "Learn the project's conventions",
  'Follow written rules',
  'Write the simple version first',
  'Check before saying done',
  'Offer, do not write',
];

test('the skill exists and passes lint', () => {
  assert.deepEqual(lintSkillDir(dir), []);
});

test('meta.yaml marks it original, draft and unmeasured', () => {
  const meta = parse(readFileSync(join(dir, 'meta.yaml'), 'utf8'));
  assert.equal(meta.class, 'original');
  assert.equal(meta.maturity, 'draft');
  assert.deepEqual(meta.sources, []);
  assert.deepEqual(meta.adapters_tested, []);
});

test('the routine has its seven steps in order', () => {
  const steps = [...text().matchAll(/^(\d)\. \*\*(.+?)\*\*/gm)].map((m) => [Number(m[1]), m[2]]);
  assert.deepEqual(steps.map(([n]) => n), [0, 1, 2, 3, 4, 5, 6]);
  STEP_TITLES.forEach((title, i) => assert.ok(steps[i][1].startsWith(title), `step ${i} should start with "${title}", got "${steps[i][1]}"`));
});

test('written rules beat the skill and habits are followed for style only', () => {
  assert.match(text(), /written rule[^.]*wins/i);
  assert.match(text(), /habit[^.]*style/i);
  assert.match(text(), /not copied/i);
});

test('the language-agnostic rules are present', () => {
  for (const phrase of ['function before a class', 'second real use', 'early return', 'Smallest diff', 'speculative']) {
    assert.ok(text().includes(phrase), `missing "${phrase}"`);
  }
});

test('with nothing to learn from, it falls back to the reference defaults', () => {
  assert.match(text(), /no (linter|configuration)[^.]*(default|reference)/i);
});

test('references are chosen from the files you touch, even in a monorepo', () => {
  assert.match(text(), /files you (are about to )?touch/i);
  assert.match(text(), /monorepo|several languages/i);
});

test('a language without a reference gets the agnostic rules and the skill says so', () => {
  assert.match(text(), /no reference[^.]*(agnostic|rules above)/i);
});

test("the user's direct request beats a written rule", () => {
  assert.match(text(), /direct request/i);
});

test('generated and vendored files are not read for conventions, and reading stops early', () => {
  assert.match(text(), /generated|vendored|lock file/i);
  assert.match(text(), /stop(ping)? when/i);
});

test('it offers and does not write the conventions file', () => {
  assert.match(text(), /do not save it unasked/i);
});

test('it names no agent tools', () => {
  assert.doesNotMatch(text(), /\b(TodoWrite|Task tool|Skill tool|Bash tool|Read tool|Edit tool|Write tool|Agent tool)\b/);
});

// ---- references: the shape every file must have, and the index that lists them

const refsDir = join(dir, 'references');
const STATUS_LINE = 'Status: draft, not measured.';
const SECTIONS = ['Simple here looks like', 'Do', 'Do not (what agents over-build here)', 'Check before finishing'];
const MAX_REFERENCE_LINES = 90;

// A framework file, and the language file it builds on.
const LANGUAGE_OF = {
  react: 'javascript',
  vue: 'javascript',
  nextjs: 'javascript',
  nuxt: 'javascript',
  'nodejs-express': 'javascript',
  django: 'python',
  fastapi: 'python',
  'spring-boot': 'java',
  laravel: 'php',
  rails: 'ruby',
  'aspnet-core': 'csharp',
};

const referenceNames = () => (existsSync(refsDir) ? readdirSync(refsDir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort() : []);
const indexedNames = () => [...text().matchAll(/^- `references\/([a-z0-9-]+)\.md`:/gm)].map((m) => m[1]).sort();
const reference = (name) => readFileSync(join(refsDir, `${name}.md`), 'utf8');

test('every indexed reference exists and every reference file is indexed', () => {
  assert.deepEqual(indexedNames(), referenceNames());
});

test('every reference has the same shape', () => {
  for (const name of referenceNames()) {
    const lines = reference(name).replace(/\n$/, '').split('\n');
    assert.equal(lines[0], STATUS_LINE, `${name}: line 1`);
    assert.ok(lines[2]?.startsWith('# '), `${name}: line 3 must be the title`);
    assert.deepEqual(lines.filter((l) => l.startsWith('## ')).map((l) => l.slice(3)), SECTIONS, `${name}: sections`);
    assert.ok(lines.length <= MAX_REFERENCE_LINES, `${name}: ${lines.length} lines (max ${MAX_REFERENCE_LINES})`);
    const check = lines.slice(lines.indexOf(`## ${SECTIONS[3]}`) + 1).filter((l) => l.startsWith('- '));
    assert.ok(check.length >= 3 && check.length <= 5, `${name}: ${check.length} check questions (3 to 5)`);
    for (const question of check) assert.ok(question.trimEnd().endsWith('?'), `${name}: "${question}" must end with ?`);
  }
});

test('every framework reference points at its language reference', () => {
  for (const [framework, language] of Object.entries(LANGUAGE_OF)) {
    if (referenceNames().includes(framework)) assert.ok(reference(framework).includes(`\`${language}.md\``), `${framework} must name \`${language}.md\``);
  }
});

test('no reference names an agent tool', () => {
  for (const name of referenceNames()) {
    assert.doesNotMatch(reference(name), /\b(TodoWrite|Task tool|Skill tool|Bash tool|Read tool|Edit tool|Write tool|Agent tool)\b/, name);
  }
});

// ---- the owner's stack: the excess named for React and Vue

test('react.md names the excess agents add in React', () => {
  const body = reference('react');
  for (const pattern of [/custom hook/i, /context/i, /wrapper component/i, /state (library|management)/i]) assert.match(body, pattern);
});

test('vue.md names the excess agents add in Vue', () => {
  const body = reference('vue');
  for (const pattern of [/composable/i, /wrapper component/i, /Pinia|state library/i]) assert.match(body, pattern);
});

test('the index lists the 25 first-pass references', () => {
  const expected = [
    'javascript', 'typescript', 'python', 'go', 'java', 'kotlin', 'csharp', 'php', 'ruby', 'rust', 'swift', 'c-cpp', 'sql', 'shell',
    'react', 'vue', 'nextjs', 'nuxt', 'nodejs-express', 'django', 'fastapi', 'spring-boot', 'laravel', 'rails', 'aspnet-core',
  ];
  assert.deepEqual(indexedNames(), [...expected].sort());
});

// ---- fixes from the final review

test('where the project gives no answer on a point, the matching reference supplies the default', () => {
  assert.match(text(), /no answer on a point[^.]*reference/i);
});

test('the references count as the generic rules, and wrapping errors or structure only for tests is structure', () => {
  assert.match(text(), /references count as these rules/i);
  assert.match(text(), /wrapping or swallowing errors[^.]*are structure/i);
});

test('the description does not present the references as a last resort', () => {
  const front = parse(text().replace(/^---\n/, '').split('\n---\n')[0]);
  assert.doesNotMatch(front.description, /when the project gives no answer/i);
});

test('the written rules are always read, and only the rest stops early', () => {
  assert.match(text(), /always read the project's written rules/i);
});

test('it says to test at the seam the project has and not to extract a helper only for tests', () => {
  assert.match(text(), /seam the project already has/i);
  assert.match(text(), /only to make code testable/i);
});

test('it deletes only what the change makes unused, never the existing layers', () => {
  assert.match(text(), /Delete what your change makes unused/);
  assert.doesNotMatch(text(), /Delete before adding/);
});

test('the interface advice keeps the interface where the project mocks through interfaces', () => {
  for (const name of ['csharp', 'java', 'php', 'swift']) assert.match(reference(name), /mock through interfaces/i, name);
});

// ---- the minor findings of the final review

const indexLine = (name) => text().split('\n').find((l) => l.startsWith(`- \`references/${name}.md\`:`));

test('a framework with no reference is covered by the "say so" line, not only a language', () => {
  assert.match(text(), /a language or framework has no reference/i);
});

test('the precedence line says a direct request beats all of these rules', () => {
  assert.match(text(), /Precedence:[^\n]*direct request/i);
});

test('the JavaScript entries select on the nearest package.json to the files touched, not any in the repository', () => {
  for (const name of ['javascript', 'react', 'vue', 'nextjs', 'nuxt', 'nodejs-express']) {
    assert.match(indexLine(name), /nearest `package\.json` above the files you touch/, name);
  }
});

test('Spring Boot with Kotlin is selected and sent to kotlin.md', () => {
  assert.match(indexLine('spring-boot'), /build\.gradle\.kts/);
  assert.match(indexLine('spring-boot'), /kotlin\.md/);
  assert.match(reference('spring-boot'), /`kotlin\.md`/);
});

test('step 0 regenerates a generated or lock file with its tool instead of editing it by hand', () => {
  assert.match(text().split('\n').find((l) => l.startsWith('0. ')), /regenerate/i);
});

test('aspnet-core separates controllers from minimal APIs for validation and injection', () => {
  assert.match(reference('aspnet-core'), /in controllers/i);
  assert.match(reference('aspnet-core'), /handler parameter/i);
});

test('c-cpp says RAII and constexpr are C++ only', () => {
  const lines = reference('c-cpp').split('\n');
  for (const line of lines.filter((l) => /RAII/.test(l))) assert.match(line, /In C\+\+/, line);
  for (const line of lines.filter((l) => /constexpr/.test(l))) assert.match(line, /C\+\+/, line);
});

test('kotlin keeps a sealed hierarchy when the cases carry different data', () => {
  assert.match(reference('kotlin'), /carry no data/i);
});

test('rust allows expect with a message for an invariant', () => {
  assert.match(reference('rust'), /expect[^.]*invariant|invariant[^.]*expect/i);
});

test('nuxt lists a database and server-only code, not only secrets, as reasons for a server route', () => {
  assert.match(reference('nuxt'), /database/i);
});

test('typescript follows the project when it says to use a type, not always type', () => {
  assert.match(reference('typescript'), /project's usual declaration/i);
});

test('sql names the dialect forms of LIMIT, and ruby says which version has Data', () => {
  assert.match(reference('sql'), /LIMIT[^.]*(dialect|TOP|FETCH)/i);
  assert.match(reference('ruby'), /Ruby 3\.2/);
});
