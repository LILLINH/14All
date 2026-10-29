# Evidence: Codex adapter

Date: 2026-10-29. Codex CLI 0.165.0, model `gpt-6-luna` at low reasoning effort. Machine: Linux, Node 22.19.0.

All runs used a clean Codex home (`CODEX_HOME` set to an empty scratch folder, with only the login file linked in), so no user settings were touched. The plugin was installed from a local clone of this repository at commit `187cd88`, which is the first commit that holds `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`. Codex installs from the committed files, not from the working tree.

## What was tested

That Codex installs the plugin, sees its skills, finds its two hooks, and, once they are trusted, receives the bootstrap and runs the guard.

## Install

```
codex plugin marketplace add <path to this repository>
codex plugin add 14all@14all
```

Result: `Added plugin 14all`, and `codex plugin list` showed `14all@14all  installed, enabled  0.1.0`. The installed copy held `.codex-plugin/`, `.agents/` and `skills/using-14all/references/codex-tools.md`.

## Skills

`codex exec` asked to list the skills of the 14all plugin it could see, without tools. It named 21 skills, among them `brainstorming`, `systematic-debugging`, `test-driven-development`, `verification-before-completion` and `using-14all`. One run. This is the model reading its own skill list, not a check of what Codex loaded.

## Hooks

- Before any trust, the interactive screen said "Hooks need review: 2 hooks are new or changed". The `/hooks` view listed one `PreToolUse` hook (matcher `Bash|Read|Grep|Edit|Write|MultiEdit`, command `run-hook.cmd guard`, 5 s) and one `SessionStart` hook (matcher `startup|clear|compact`, command `run-hook.cmd session-start`, 10 s), both with source `Plugin - 14all@14all`. The path in each command had `${CLAUDE_PLUGIN_ROOT}` already replaced by the installed plugin folder.
- Without trust, the marker question returned `NONE`: Codex does not run a plugin hook until the user trusts it.
- Both hooks were then trusted in the `/hooks` screen (one at a time, after reading each). The screen then showed both as active, and `config.toml` held a trusted hash for each.

## Bootstrap

Prompt, headless, in an empty scratch directory: "Reply with only the exact marker string beginning with 14ALL-BOOTSTRAP that appears in the context you were given at session start, or the word NONE. Do not use any tools."

- Hooks trusted: `14ALL-BOOTSTRAP-V1`.
- Hooks not trusted: `NONE`.

One run each.

## Guard

In a scratch git repository on `main` with no remote, `codex exec` with the workspace-write sandbox, hooks trusted:

- "Run exactly this shell command ...: `git push --force origin main`": the command did not run. Codex reported "Command blocked by PreToolUse hook: 14All guard: force push to main or master. ..."
- `cat .env` (the file held a dummy value): blocked by the guard as a secrets file; the file's content was not printed.
- Control, `git status --short`: ran and printed its output.

One run each. This shows that Codex reads the guard's denial and stops the call for shell commands.

## Installing from the GitHub address, and from a clone of it

After the Codex files were pushed (commit `1fd257f`), the same checks were run twice more with new clean Codex homes. Both homes had both hooks reviewed and trusted in `/hooks` in the same way, and the installed files were the same commit.

| Home | Marketplace added with | `source_type` in `config.toml` | Skills | Bootstrap | Guard |
|---|---|---|---|---|---|
| A | `codex plugin marketplace add LILLINH/14All` | `git` | 21 listed | `NONE`; log line `hook: SessionStart Failed` | did not block `git push --force origin main` (it failed on its own, no remote) and `cat .env` printed the file |
| B | `codex plugin marketplace add <clone of the GitHub repository>` | `local` | not repeated | `14ALL-BOOTSTRAP-V1`; `hook: SessionStart Completed` | blocked the force push and `cat .env`; the control command ran |

Home A had been checked against the earlier install (`187cd88`, local source), which worked in a controlled re-run in the same directory, and the hook script gave byte-identical output in both installs. A process trace of `codex exec` showed Codex running `/bin/bash -c ".../run-hook.cmd session-start"` for the local install and never starting the hook for the `git` one: Codex reports the hook as failed before it runs it. Both homes read the same marketplace file (`.agents/plugins/marketplace.json`). The difference seen is the marketplace source. Why Codex does this was not found; no error message names a cause, and Codex's plugin documentation says only that hooks are supported for manually installed plugins. One run each.

The README therefore tells Codex users to clone the repository and add the clone.

## What this does not show

- Why Codex fails the hooks of a plugin added from a `git` source, or whether a later Codex version does the same.
- That a skill is chosen when it should be, or followed. No evaluation was run on Codex, and the evaluation runner calls Claude Code only.
- The `clear`, `compact` and `resume` starts. Only a fresh headless start was run.
- Edits. Codex edits files with `apply_patch`, and the guard does not handle that tool, so the "ask before a lint or format configuration is edited" rule does not apply on Codex. Codex does not support an "ask" answer from a hook yet (its documentation). Also, Codex has no separate `Read` or `Grep` tool, so those two matchers never fire; secret reads are caught only through shell commands.
- The role agents in `agents/`. Codex's plugin documentation does not describe agents; nothing was run to check.
- Windows, the Codex desktop app, and any session other than `codex exec` plus the `/hooks` screen.
- That the tool names in `skills/using-14all/references/codex-tools.md` match the tools of a live session. They come from Codex's documentation.
