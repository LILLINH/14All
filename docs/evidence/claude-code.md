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

## What this does not show

- Installing through a marketplace (`/plugin marketplace add`, `/plugin install`). The repository is not published yet, and the `OWNER` placeholder is unreplaced. Not tested.
- That the model then invokes 14All skills correctly. That is what evaluations E1 to E4 measure (Task 14 and Task 15).
- The `compact`, `clear` and `startup` matchers individually. Only the headless startup path was run.
- Windows. `hooks/run-hook.cmd` has a Windows branch that has never been run.
- Interactive sessions (only `-p` headless mode was run).
