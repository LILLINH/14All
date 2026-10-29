# Codex Tool Map

14All skills name actions. In Codex, use these tools for them. The tool names come from Codex's hook documentation (checked 2026-10-29); none of them has been seen used with 14All in a session yet.

| Action in a skill | Codex |
|---|---|
| Invoke a skill | Open the skill's `SKILL.md` from the skills list and follow it |
| Dispatch a subagent | `spawn_agent`; give it a complete brief, since it does not see this conversation |
| Run subagents in parallel | Several `spawn_agent` calls in one turn |
| Track tasks or a checklist | `update_plan` |
| Read a file | A shell command such as `cat` or `sed -n` |
| Create or edit a file | `apply_patch` |
| Search files or file contents | A shell command such as `rg` or `find` |
| Run a shell command | The shell tool (`exec_command`) |
| Ask the user a question | Plain text in the reply |

Notes:

- Codex has no separate read or search tool, so reading and searching go through the shell. Keep the output small.
- The `agents/` directory of this plugin is not used by Codex. For a read-only reviewer, dispatch a subagent and tell it in the brief to change nothing.
- Hooks run outside the conversation. A blocked command shows up as a tool error; read the message and change the plan instead of retrying the same command. Plugin hooks run only after the user has trusted them with `/hooks`.
- The guard hook checks shell commands. It does not see edits made with `apply_patch`, so it does not ask before a lint or format configuration is edited.
