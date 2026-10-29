# Security

14All installs instructions and hooks into AI coding agents, so a flaw in it runs with the permissions of whoever installs it.

## Reporting a problem

Open a private security advisory on the repository (Security, then Report a vulnerability). Do not post details in a public issue. Once the repository has a published `OWNER`, the advisory page is the contact; until then, contact the maintainer directly.

Useful reports include: a hook that runs something it should not, a skill that tells an agent to exfiltrate data or bypass its permissions, a way to make the session-start hook emit something other than the bootstrap skill, or a secret committed to the repository.

## What the hooks do

- `hooks/session-start` reads one file in the plugin (`skills/using-14all/SKILL.md`) and prints it as JSON. No network, no `eval`.
- `hooks/guard` reads the tool call on stdin and prints a denial or nothing. It makes no network calls and writes nothing. It is a safety net against slips, not a security boundary: a differently spelled command gets past it. Do not rely on it to contain an untrusted agent; use the agent's own permission and sandbox settings for that.

Both use only shell built-ins, so they work with an empty `PATH` and never block a session on an error.

## Supply chain

Upstream material is pinned to a commit in `upstream/sources.json`, with its license checked by `npm run check:upstream`. CI actions are pinned to commit SHAs. `npm run check:drift` lists upstream releases newer than the pin.
