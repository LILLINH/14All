const PATTERNS = [
  { name: 'aws-access-key-id', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'github-token', regex: /\b(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/ },
  { name: 'anthropic-api-key', regex: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'openai-api-key', regex: /\bsk-(?!ant-)[A-Za-z0-9_-]{32,}/ },
  { name: 'slack-token', regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'google-api-key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'private-key', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  {
    name: 'generic-assignment',
    regex: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9_\-+/=]{20,}/i,
  },
];

/** Find likely secrets. Returns pattern names and 1-based line numbers, never the matched text. */
export function scanText(text) {
  const findings = [];
  text.split('\n').forEach((line, i) => {
    for (const { name, regex } of PATTERNS) {
      if (regex.test(line)) findings.push({ pattern: name, line: i + 1 });
    }
  });
  return findings;
}
