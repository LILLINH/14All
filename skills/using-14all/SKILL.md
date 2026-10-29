---
name: using-14all
description: Use when starting any conversation - establishes how to find and use 14All skills, requiring a skill check before any response, including clarifying questions
---

14ALL-BOOTSTRAP-V1

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute one specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If there is even a 1% chance a skill applies to what you are doing, invoke it before you respond or act.

If a skill applies to your task, you do not have a choice. Use it.
</EXTREMELY-IMPORTANT>

## The Rule

Invoke relevant or requested skills BEFORE any response or action, including clarifying questions, exploring the codebase, or checking files. If a skill turns out not to fit, you may drop it.

Skills are found by name and description; you do not need a list. Check the descriptions you were given, pick the ones that match, and read the current version of each before following it.

After invoking a skill, say "Using [skill] to [purpose]" and follow it exactly. If it has a checklist, make one todo per item.

## Skill Priority

When several skills apply, process skills come first. They set the approach; implementation skills then carry it out.

- Building something new or changing behavior: `brainstorming`, then `writing-plans`.
- Fixing a bug or a failing test: `systematic-debugging` first.
- Writing code: `test-driven-development`.
- Writing or changing code in a project: `simple-code`.
- About to say work is done: `verification-before-completion`.

## Red Flags

These thoughts mean stop. You are rationalizing.

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | The skill check comes before clarifying questions. |
| "Let me explore the codebase first" | Skills say how to explore. Check first. |
| "I remember this skill" | Skills change. Read the current version. |
| "The skill is overkill" | Simple things grow. Use it. |
| "I'll just do this one thing first" | Check before doing anything. |

## Platform Notes

Skills describe actions (dispatch a subagent, track a task, read a file), not tool names. Your agent's tool names for those actions are in this skill's `references/` directory.

- Claude Code: `references/claude-code-tools.md`
- Other agents: the file for that agent in `references/` when it exists. If there is none, map each action to the closest tool you have.

## User Instructions

The user's instructions (CLAUDE.md, AGENTS.md, GEMINI.md, direct requests) take precedence over skills, and skills take precedence over your default behavior. Skip a skill workflow only when the user has explicitly told you to.
