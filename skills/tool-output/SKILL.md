---
name: tool-output
description: Use when about to run a command or read a file whose output may be long, such as a test suite, a build, a log, a diff, a search or a large file, or when your context is filling with tool output.
---

# Tool Output

Everything a tool prints stays in your context for the rest of the session. Most of it you will never use. Ask for less, keep the rest out, and never hide a failure.

## Ask for less at the source

- Use the quiet or summary form of a command, and narrow the query: a stat of a diff before the diff, a count before the matches, the failing tests before the whole run.
- Read a line range, not a whole file. Count the lines of a file or a log before you read it.
- Search for what you need with a precise pattern before you open anything.

## Keep long output in a file

Send long output to a file, then read a slice of it: the tail, the lines around a match, the lines with an error. The file path is your way back to the rest, so keep it in your notes.

## Print the answer, not the data

When you need a count, a list of names or one value, write a small throwaway script that prints only that, instead of reading the data and working it out yourself.

## Choose by intent

- To process or count output: extract it with code and print the result.
- To look at a short, fixed output: run the command and read it.
- To edit a file: read the part you are about to change, with its surroundings.

## When you trim output

1. An explicit request for detail is never trimmed: a verbose flag, or a user who wants the full output, gets all of it.
2. A trimmed view is a shorter version of the real output, in the same format, not a new format you have to decode.
3. Never lose the failure: errors, failing tests, the first and last lines and the exit status stay visible. If the trimmed result is empty when you expected output, or contradicts the exit status, run the command again without the trimming.
4. Every cut leaves a way back: the path of the full output, or the command to repeat it.

## Pointers over restatement

In notes, reports and handoffs write `path:line` and say what is there; do not paste the code. A pointer that was cut costs a whole turn to find again.

## Never shorten

A security warning, the confirmation of an irreversible action, a multi-step instruction, and a negation ("do not", "never", "except"). Cutting any of these changes what the words say.
