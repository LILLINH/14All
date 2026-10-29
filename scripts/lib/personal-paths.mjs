// A path under a real person's home directory in a file names a machine and a person. The placeholders
// below are the names documentation uses for "your own", and the users that containers and CI create.

const PLACEHOLDERS = new Set(['user', 'you', 'me', 'name', 'username', 'example', 'runner', 'shared', 'public', 'ubuntu', 'node', 'vscode', 'root', 'default', 'ec2-user', 'admin', 'vagrant']);
// A one-letter name ("u", "x") is made up: a real login is longer.
const isPlaceholder = (name) => name.length <= 1 || PLACEHOLDERS.has(name.toLowerCase());
// A home path does not follow a letter, a digit or a dot, so a URL or another word that merely contains
// "/home/" is not matched; it may follow any punctuation, and "file://" . It is written with plain, escaped or
// WSL separators, in any letter case.
const HOME_PATH = /(?<![A-Za-z0-9.])(?:\/home\/|\/Users\/|\/mnt\/[a-z]\/Users\/|[A-Za-z]:\\{1,2}Users\\{1,2})([A-Za-z0-9_.-]+)/gi;

/** Lines (1-based) that hold a home path of a real person. The finding never holds the path. */
export function findPersonalPaths(text) {
  const findings = [];
  text.split('\n').forEach((line, index) => {
    if ([...line.matchAll(HOME_PATH)].some(([, name]) => !isPlaceholder(name))) findings.push({ line: index + 1 });
  });
  return findings;
}
