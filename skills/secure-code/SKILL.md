---
name: secure-code
description: Use when writing or changing code that takes input from outside, handles authentication, authorization, secrets, files, network requests, database queries or the output of a language model.
---

# Secure Code

Security problems come from what an outsider can send, not from what the code is meant to do. Start from the outsider.

## Threat model first

Before you write the code, write five lines (in your notes, not in the code):

1. What is worth protecting (data, money, accounts, the machine).
2. Where the trust boundaries are: what comes from outside, what is inside.
3. The entry points: each route, form, file, message, command-line argument and environment variable.
4. Who can send what to each entry point, with what permission.
5. Two or three abuse cases: "someone sends X to get Y".

## Always, ask first, never

**Always**
- Validate input at the boundary, by what is allowed, not by what is forbidden.
- Use parameterized queries and argument lists. Check authorization on every request and on every object, not only at login.
- Hash passwords with a slow, salted hash. Keep secrets in the environment or a secret store.
- Treat the data inside the boundary as trusted only after it has passed the boundary.

**Ask first**
- A new dependency, a change to authentication or permissions, a new request to an address the user can choose, storing personal data, a new way to run user-supplied code.

**Never**
- Build a query, a command or a path from raw input.
- Disable a check, or catch and ignore its error, to make a test pass.
- Commit a secret, or log a password, a token or a full card number.
- Trust a client-side check as the only check.

## The usual holes

Injection (query, command, template); path traversal; server-side request forgery; a missing authorization check; unsafe deserialization; weak randomness or hashing; open redirects; cross-site scripting and request forgery; outdated dependencies; error messages that reveal internals.

## A language model in the code

- Its output is untrusted input: validate it, and never run it as code or as a command without a check.
- Give each tool the least permission the task needs.
- Keep secrets and other users' data out of its prompts.
- A person confirms an irreversible action.

## Reporting

For each problem say where (`file:line`), who sends what to get what, the fix, and how you know: `read` (in the code), `inferred` (reasoned, not run) or `unverified`. For a dedicated pass over a diff or a directory use the `security-auditor` agent; `code-review` covers the rest of a review.
