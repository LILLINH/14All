# Claude Code Tool Map

14All skills name actions. In Claude Code, use these tools for them.

| Action in a skill | Claude Code |
|---|---|
| Invoke a skill | The `Skill` tool, by skill name |
| Dispatch a subagent | The `Agent` tool; give it a complete brief, since it does not see this conversation |
| Run subagents in parallel | Several `Agent` calls in one message |
| Track tasks or a checklist | The todo list tool |
| Read, create, or edit a file | `Read`, `Write`, `Edit` |
| Search files or file contents | `Glob` and `Grep` |
| Run a shell command | `Bash` |
| Ask the user a question | Plain text in the reply, or the question tool when a short set of options helps |

Notes:

- A subagent returns one final message. Anything the skill needs from it must be asked for in the brief.
- Hooks run outside the conversation. A blocked command shows up as a tool error; read the message and change the plan instead of retrying the same command.
