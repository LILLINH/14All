# <Project name>

<!-- Fill every section. Delete a line that a script or a config file already says. Keep this file under 32 KiB and, better, under 200 lines. Link longer material; do not paste it. -->

## What this is

Two lines: what the project does, and who uses it.

## Commands

One line each, written as the command and not as a description. Only the ones an agent will run.

- Install: `<command>`
- Test: `<command>` (and how to run a single test)
- Build or start: `<command>`
- Lint or check: `<command>`

## Layout

A few lines: where the source, the tests and the generated files are. Name only what a new reader could not guess.

## Conventions

What no config file states: a naming rule that is not enforced, a pattern the team prefers, a layer not to add, the reason behind a choice. One line each, in the positive form ("write X"), each one something the agent would otherwise get wrong.

## Verify before you say done

The command that proves a change works, and what a pass looks like. Say what to read in its output, not only what to run.

## Do not touch

Generated files, vendored code, the lock file (regenerate it with its tool), files that hold secrets, paths another team owns. For each, say what to do instead.

## Where more is written

Pointers to longer documents, each with the case that calls for it: "Architecture: docs/architecture.md (read before changing a module boundary)".

## Notes for the next session

Where progress notes or handoffs go, if the project uses them (for example `.14all/progress/`).
