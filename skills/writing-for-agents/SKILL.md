---
name: writing-for-agents
description: Use when creating or editing a skill, an AGENTS.md or CLAUDE.md, or any other document an agent will read.
---

# Writing for Agents

An agent runs a document, it does not just read it: the same words steer it the same way every time. Write so that the process is the same on every run.

## Context pointers

A skill's description, and a line in `AGENTS.md` that names another document, are **context pointers**: text that sits in the agent's context and says when to reach something that is not there. The wording of the pointer, not the target, decides whether the agent reaches it. When the agent misses something it needs, sharpen the pointer before you copy the material into the always-loaded file.

- Say what the material is and which distinct cases should trigger it. One trigger per case: two synonyms for one case are one trigger written twice.
- Put the word that triggers it first, and cut what the body already says.

## Two loads

- **Context load:** always-loaded text (an `AGENTS.md` line, a skill description) costs tokens and attention on every turn, used or not.
- **Cognitive load:** each document that exists is one more thing a person must remember and know when to use.

Spend each where it earns it. Material behind a pointer costs only the pointer's line; material with no pointer costs the person's memory.

## Information hierarchy

Put what the agent does first, as steps in order. Put what it consults on demand next: rules, definitions, facts. Put reference that only some cases need in a separate file behind a pointer (`references/`). Inline what every case needs and push out what only some reach. Push out too little and the top bloats; too much and the agent misses what it needs. Keep a concept's definition, rules and caveats together under one heading.

## Completion criteria

End every step on a condition the agent can check. A vague end ("until it is understood") invites stopping early. The strongest criteria are checkable and exhaustive: "every changed file has a test", not "write tests".

## Say what to do

A prohibition puts the forbidden thing in front of the agent and makes it more likely. State the behaviour you want ("write one-line comments"). Keep a prohibition for a hard limit you cannot put positively, and pair it with the behaviour you want.

## Pruning

- Keep each meaning in a single source of truth. Say it once.
- Do not restate what the environment already says (a `package.json` script, a config file, `--help`). Write down what the agent cannot find by looking: the unwritten convention, the reason for a choice, the trap no config shows.
- Delete a sentence that does not change what the agent does by default, and a line that has gone stale. Deleting feels risky and adding feels safe; without the discipline the file fills with old layers.

## A skill

- The frontmatter has only `name` and `description`. The description starts "Use when" and names the situation, not the steps: the agent decides from it alone.
- Keep the body under 400 lines and move detail into `references/`, each with a pointer that says when to read it.
- Name actions ("dispatch a subagent"), not the name of a tool.
- In the 14All repository, `npm run new-skill -- <name>` makes one that passes the lint.

## An AGENTS.md

Start from `references/agents-md-template.md`. Keep the file under 32 KiB (a limit some agents apply) and, better, under 200 lines. Link longer material instead of pasting it.
