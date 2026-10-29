---
name: working-notes
description: Use when a task will outlast one context window or session and has no written plan, such as a long investigation, a migration or an exploration. Keeps a notes file on disk so the work survives /clear and compaction.
---

# Working Notes

Conversation memory does not survive `/clear` or compaction. A file on disk does. Keep one notes file for the task and trust it over what you remember.

With a written plan, use the `executing-plans` skill instead: it keeps its own progress file in the same place.

## The file

Create `.14all/progress/<slug>.md` and make sure git ignores it (add `.14all/` to `.git/info/exclude` if the repository does not). Its first line is `# Progress - notes: <slug>`. The session-start hook loads the newest file in that directory at the start of a session, after `/clear` and after compaction, so write it for a reader who remembers nothing.

```
# Progress - notes: <slug>
Goal: <one sentence>

### Step 1: <name>
Status: pending|in_progress|done
Evidence: <command> -> <result>

## Findings
- <fact> (source: <file, command or link>)

## Next step
<the one thing to do first>
```

## Rules

- One step is `in_progress` at a time. Finish it or mark why it stopped before you start another.
- A step is `done` only with an `Evidence:` line: the command you ran and what it showed. No evidence, not done.
- Write to the file at the end of each step and before any risky operation (a migration, a delete, a rewrite), not at the end of the task.
- Record a finding with its source. Keep guesses out of Findings; put them in the next step as questions.
- Stop after three rounds without new evidence. Tell the user what you tried and what is blocking you, instead of trying a fourth time.

## Coming back

1. Read the file, then run `git status` and `git log` to see what really happened since. Trust them over the file where they disagree, and fix the file.
2. Run the last `Evidence:` command again before you build on it.
3. If the file exists and the session start did not show it, the hook did not fire: read the file yourself and tell the user.

## Finish

Delete the file when the task is done. If you must stop with the work unfinished, write a `handoff` note and keep the file until the next session has picked it up.
