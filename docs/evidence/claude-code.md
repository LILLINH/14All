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

## What this does not show

- Installing through a marketplace (`/plugin marketplace add`, `/plugin install`). The repository is now published at github.com/LILLINH/14All and the manifests name it, but the install was not tried. Not tested.
- That the model then invokes 14All skills correctly. That is what evaluations E1 to E4 measure (Task 14 and Task 15).
- The `compact`, `clear` and `startup` matchers individually. Only the headless startup path was run.
- Windows. `hooks/run-hook.cmd` has a Windows branch that has never been run.
- Interactive sessions (only `-p` headless mode was run).
