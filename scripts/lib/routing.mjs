// A vocabulary check on skill descriptions. A skill is chosen by its description, so a description should
// share words with what a person would ask for, and should not read like another skill's. This scores
// prompts against descriptions with a plain TF-IDF cosine; it does not show that a model picks the right
// skill, only that the words are there and that descriptions do not blur into each other.

const STOP_WORDS = new Set(
  'a an the to of and or for in on is it its you your use when with that this these those be been as at by from into than then so if not no do does did can could should would will we i me my our us what which who how about any all each every more most other some such only own same too very just but are was were has have had'.split(' '),
);

const tokens = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !STOP_WORDS.has(word));

const termCounts = (words) => {
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return counts;
};

/** The text a skill is chosen by: its name, with hyphens as spaces, and its description. */
const skillText = ({ name, description }) => `${name.replace(/-/g, ' ')} ${description}`;

function buildIndex(skills) {
  const docs = skills.map((skill) => termCounts(tokens(skillText(skill))));
  const df = new Map();
  for (const doc of docs) for (const term of doc.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const idf = (term) => Math.log((skills.length + 1) / ((df.get(term) ?? 0) + 1)) + 1;
  const vector = (counts) => new Map([...counts].filter(([term]) => df.has(term)).map(([term, count]) => [term, count * idf(term)]));
  return { vectors: docs.map(vector), vector };
}

function cosine(a, b) {
  let dot = 0;
  for (const [term, weight] of a) dot += weight * (b.get(term) ?? 0);
  const norm = (v) => Math.sqrt([...v.values()].reduce((sum, w) => sum + w * w, 0));
  const denominator = norm(a) * norm(b);
  return denominator === 0 ? 0 : dot / denominator;
}

/** The skills ranked by similarity to the prompt, best first; a tie keeps the order of `skills`. */
export function rankSkills(prompt, skills) {
  const { vectors, vector } = buildIndex(skills);
  const query = vector(termCounts(tokens(prompt)));
  return skills.map(({ name }, i) => ({ name, score: cosine(query, vectors[i]) })).sort((x, y) => y.score - x.score);
}

/** Pairs of skills whose descriptions are more alike than `threshold`, as [nameA, nameB, score]. */
export function findCollisions(skills, threshold = 0.75) {
  const { vectors } = buildIndex(skills);
  const pairs = [];
  for (let i = 0; i < skills.length; i += 1) {
    for (let j = i + 1; j < skills.length; j += 1) {
      const score = cosine(vectors[i], vectors[j]);
      if (score > threshold) pairs.push([skills[i].name, skills[j].name, score]);
    }
  }
  return pairs;
}

/**
 * Check the cases and the collisions. A case is { skill, prompt, status?: 'known-gap', reason? }. A known gap
 * that misses is reported in `gaps`; one without a reason, or one that now passes, is a problem.
 */
export function checkRouting({ skills, cases, topK = 3, threshold = 0.75 }) {
  const problems = [];
  const gaps = [];
  const names = new Set(skills.map((s) => s.name));
  for (const { skill, prompt, status, reason } of cases) {
    const label = `"${prompt.slice(0, 60)}" (${skill})`;
    if (!names.has(skill)) {
      problems.push(`${label}: unknown skill`);
      continue;
    }
    const top = rankSkills(prompt, skills).slice(0, topK).map((r) => r.name);
    const hit = top.includes(skill);
    if (status === 'known-gap') {
      if (!reason) problems.push(`${label}: a known-gap case needs a reason`);
      else if (hit) problems.push(`${label}: no longer a gap, remove its known-gap status`);
      else gaps.push(`${label}: ${reason}`);
    } else if (!hit) {
      problems.push(`${label}: the skill is not in the top ${topK} (got ${top.join(', ')})`);
    }
  }
  for (const [a, b, score] of findCollisions(skills, threshold)) problems.push(`descriptions of ${a} and ${b} collide (${score.toFixed(2)})`);
  return { problems, gaps };
}
