# Evidence: Claude Code adapter

Date: 2026-10-28. Claude Code version: 2.1.312. Model reported by the CLI: claude-sonnet-5-5. Machine: Linux, Node 22.19.0.

## What was tested

That the `SessionStart` hook in this repository injects the `using-14all` bootstrap into a Claude Code session when the plugin is loaded for that session only (no change to user-level settings).

## Commands and results

1. Manifest validation, run from the repository root:

   ```
   claude plugin validate .
   ```

   Result: `Validation passed`. One advisory warning remains about the plugin-directory catalog: `.claude-plugin/plugin.json` has no `icon` (ICON_MISSING). It does not change the verdict and is deferred.

2. Headless session with the plugin loaded for this session only:

   ```
   claude -p "Reply with only the exact marker string beginning with 14ALL-BOOTSTRAP that appears in the context you were given at session start, or the word NONE if there is no such string. Do not use any tools." --plugin-dir . --output-format json
   ```

   Result: `"result": "14ALL-BOOTSTRAP-V1"`, `is_error: false`.

3. Baseline, identical prompt without `--plugin-dir`:

   Result: `"result": "NONE"`, `is_error: false`.

## What this shows

With the plugin loaded, the session-start hook delivers the bootstrap skill to the model; without it, the model has no such context. One run each.

## Guard hook (`hooks/guard`), one live run

Date: 2026-10-28, Claude Code 2.1.312, headless, in a scratch git repository on branch `main` with no remote. Prompt: "Run exactly this shell command and report its output verbatim, do not try alternatives: git push --force origin main", with `--allowedTools Bash` and `--setting-sources project,local`.

- With `--plugin-dir <repo>`: the command did not run. The agent reported a PreToolUse hook denial: "14All guard: force push to main or master. If you really mean it, ask the user to run it themselves, or to set ALL14_GUARD=off for the session." `is_error: false`.
- Without the plugin: the command ran and failed on its own ("'origin' does not appear to be a git repository", exit 128).

This shows the denial JSON is read by Claude Code and stops that tool call. It does not show the other rules (`rm`, pipe-to-shell, raw disk, secret reads) in a live session; those are covered by `tests/guard.test.mjs` only. One run each.

## Role agents and the new skills, one live listing

Date: 2026-10-29, Claude Code 2.1.312, headless, started from an empty scratch directory outside the repository. Command (the plugin directory is this repository):

```
claude -p "reply with the word ok" --plugin-dir <repo> --setting-sources project,local --no-session-persistence --output-format stream-json --verbose
```

The first `system` message with subtype `init` listed these agents: `14all:debugger`, `14all:preship-reviewer`, `14all:reviewer`, `14all:security-auditor`, next to Claude Code's own `claude`, `Explore`, `general-purpose`, `Plan` and `statusline-setup`. Its `skills` list included `14all:handoff`, `14all:working-notes`, `14all:tool-output`, `14all:secure-code`, `14all:impact-check` and `14all:research`. The run ended with `success`, `is_error: false`, a one-word reply and a cost of about 4 cents.

This shows that Claude Code reads `agents/` and the new skill directories from the plugin in one headless session. It does not show that a dispatched agent obeys its read-only tool list, that an agent is chosen when it should be, or whether other coding agents read `agents/` (not checked). One run. The session also listed other plugins that were not part of this repository.

## All 21 skills and the four agents, one live listing

Date: 2026-10-29, Claude Code 2.1.312, headless, started from an empty scratch directory outside the repository, with the same command as the previous section (`claude -p "reply with the word ok" --plugin-dir <repo> --setting-sources project,local --no-session-persistence --output-format stream-json --verbose`).

The first `system` message with subtype `init` listed 21 skills with the `14all:` prefix, among them `14all:writing-for-agents`, and the four agents `14all:debugger`, `14all:preship-reviewer`, `14all:reviewer` and `14all:security-auditor`. The run ended with `success`, `is_error: false` and a cost of about 3 cents.

This shows that Claude Code lists the skills and agents of the plugin, including the one added last. It does not show that a skill is chosen when it should be, or followed when it is; that is what evaluations measure, and none has been run for these skills. It does not show whether the `AGENTS.md` and `CLAUDE.md` at the plugin root were loaded as context. One run.

## Marketplace install, one run

Date: 2026-10-29, Claude Code 2.1.312, Linux. A clean configuration directory (`CLAUDE_CONFIG_DIR` set to an empty scratch folder), so no user settings were touched:

```
claude plugin marketplace add LILLINH/14All
claude plugin install 14all@14all
claude plugin list
```

Result: the repository was cloned from `https://github.com/LILLINH/14All.git`, the marketplace manifest validated, and the plugin installed (scope user). `plugin list` showed `14all@14all`, version 0.1.0, enabled. This was the published `main`, before the manifest wording change of the same day.

This shows that the two install commands in the README work against the public repository. It does not show that a session started after this install receives the bootstrap or the skills: the clean configuration was not logged in, so no session was run.

## What this does not show

- A session started after a marketplace install. The install itself is covered by the section above; the bootstrap, skills and guard were only seen through `--plugin-dir`.
- That the model then invokes 14All skills correctly. That is what evaluations E1 to E4 measure (Task 14 and Task 15).
- The `compact`, `clear` and `startup` matchers individually. Only the headless startup path was run.
- Windows. `hooks/run-hook.cmd` has a Windows branch that has never been run.
- Interactive sessions (only `-p` headless mode was run).
