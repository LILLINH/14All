// A path under a real person's home directory in a tracked file names a machine and a person. The
// placeholders below are the names documentation uses for "your own".

const PLACEHOLDERS = new Set(['user', 'you', 'me', 'name', 'username', 'example', 'runner']);
// A one-letter name ("u", "x") is made up: a real login is longer.
const isPlaceholder = (name) => name.length <= 1 || PLACEHOLDERS.has(name.toLowerCase());
// A home path starts a line or follows white space, a quote, a backtick, "(", "=" or ":", so a URL or
// another word that merely contains "/home/" is not matched.
const HOME_PATH = /(?:^|[\s"'`(=:])(?:\/home\/|\/Users\/|[A-Za-z]:\\Users\\)([A-Za-z0-9_.-]+)/g;

/** Lines (1-based) that hold a home path of a real person. The finding never holds the path. */
export function findPersonalPaths(text) {
  const findings = [];
  text.split('\n').forEach((line, index) => {
    if ([...line.matchAll(HOME_PATH)].some(([, name]) => !isPlaceholder(name))) findings.push({ line: index + 1 });
  });
  return findings;
}
