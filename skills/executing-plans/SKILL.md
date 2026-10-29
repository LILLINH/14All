---
name: executing-plans
description: Use when executing an implementation plan yourself in the current session, because the user chose inline execution or you have no way to dispatch subagents.
---

# Executing Plans

Implement the plan yourself, task by task, in this session. No implementer subagent per task and no reviewer per task; one fresh review of the whole result at the end.

Announce at the start: "I'm using the executing-plans skill to implement this plan."

**Why inline:** it costs one context (yours) plus one review, where subagent-driven development pays a fresh implementer and reviewer for every task. What it gives up is a fresh context per task and a second pair of eyes per task. This skill replaces them with the plan as the brief, a progress file as your memory, test-driven development as the per-task gate, and the final review as the second pair of eyes.

**Core principle:** the plan already did the thinking. Execute it exactly, prove each step with a test you watched fail and then pass, and leave a record that survives your own forgetting.

## Run continuously

Do not pause between tasks to ask "should I continue?". Execute the whole plan. Decide conflicts, ambiguities and plan defects yourself, with the spec as the binding authority, and record each decision in the progress file as `Ruling: <decision> - <why> - <cost if wrong>`. A deviation from the plan with no ruling is a decision made in secret.

Stop only for an irreversible or destructive operation, a security-sensitive action, a side effect outside the workspace that you would normally ask about first (a merge, a push to a shared branch, a publish), or a plan so broken every path forward is a guess.

## Setup

1. Work in an isolated workspace (see `using-git-worktrees`). Never start implementation on main or master without the user's consent.
2. Keep a progress file at `.14all/progress/<plan-file-name>.md` and make sure git ignores it (add `.14all/` to `.git/info/exclude` if the repository does not). Its first line is `# Progress - plan: <plan file path>`. Conversation memory does not survive compaction; a progress file does. After a compaction, trust the file and `git log` over what you remember, and resume at the first task with no `Task <N>: complete` line. A file whose first line names a different plan belongs to that plan: leave it and start your own. The second line is `Plan hash: <output of git hash-object <plan file>>`. When you resume, compute the hash again: a mismatch means the plan was edited after the work began, so read what changed (`git log -p` on the plan file) and record a `Ruling:` before you continue. A file with no hash line, written before this rule, is accepted as it is.
3. Read the plan once, with the spec it names. The spec is the authority; conflicts inside the plan resolve against it. Make one todo per task.
4. Load the `test-driven-development` skill before Task 1. It governs every step below.
5. Scan the plan for conflicts between tasks: for every task that uses what an earlier task produces, check that the two agree on names, signatures and values. Rule on each conflict you find and record it. A plan whose tasks share nothing gets the line `Pre-flight: no shared interfaces`.

## Each task

1. Re-read the task's text in the plan. What you remember is a summary; the task has the exact values, signatures and test cases. Mark its todo in progress.
2. Work the steps in order, test first. A test step is written and run before the code it tests, and watching it fail is a step, not a formality.
3. Every step that runs a command has an expected result. Run it, read the output, compare:
   - **It matches.** Go on.
   - **The code is wrong.** Use the `systematic-debugging` skill and find the cause. Never patch the symptom to make the output match.
   - **The plan is wrong** (it contradicts the spec, an interface does not match, a command cannot work). Make the smallest change that satisfies the spec and record `Task <N>: Ruling: <finding> - <what you decided and why>`.
4. Commit as the plan says.
5. Before you mark the task done, all of these are true, with output you read in this session:
   - every test the task names exists and ran;
   - the final test run for the task passed;
   - every expected result was compared with real output;
   - every deviation has a ruling.

   The `verification-before-completion` skill governs the claim. Then append `Task <N>: complete (commits <base>..<head>, tests: <command> -> <result>)` to the progress file, in the same call as the commit when you can, and mark the todo done.

Keep output small: redirect long test output to a file and read its tail.

## Final review

Request one `code-review` of the whole branch: from the commit the branch started from (`git merge-base main HEAD`) to HEAD, with the plan, the spec and your `Ruling:` lines.

- With a subagent tool, use a fresh reviewer, on the most capable model available. Do not replace it with your own read of the diff; same author means same blind spots.
- Without one, do the review yourself as a separate pass after the last task, write `Final review: self-review (no subagent tool)` in the progress file, and say so in your final message. A self-review by the author is weaker, and the user decides whether that is enough before merge.

Re-grade the findings by effect: what a reasonable person using the software gets if it ships, not whether the spec names the input. Fix the Critical and Important ones in one pass, each with a test that fails first, then passes, then a green full suite. Record each as `Final: fixed <finding> - <test name>`. Minor findings are not fixed; record `Final: minor (deferred): <one line>` and list them in your final message. A finding you decide not to fix is a ruling.

## Finish

Your final message is the only place the decisions you took on the user's behalf reach them. List every `Ruling:` line under "Rulings I made", each with its cost if wrong, and every deferred minor under "Deferred minors".

Then delete this plan's progress file and use the `finishing-a-development-branch` skill.

## Common rationalizations

| Excuse | Reality |
|---|---|
| "I remember what Task N says" | You remember a summary. Re-read the task. |
| "The plan's test is right, skip watching it fail" | A test you never saw fail proves nothing. It is one step. |
| "I'll run the full suite at the end" | Per-step runs show which step broke it. The end-of-task run is the contract, not a substitute. |
| "The plan is wrong here, I'll just do the right thing" | Do it and record the ruling. An unrecorded deviation is a decision made in secret. |
| "I'll write progress lines after a few tasks" | Compaction does not wait. One line per task. |
| "Let me check in before the next task" | They chose inline to spend less. Only the stops above stop you. |
| "I read my own diff; the review is redundant" | Same author, same blind spots. The review is the one fresh context this run buys. |
| "Tests should pass, the change was trivial" | "Should" is not evidence. Run the command and read the output. |
