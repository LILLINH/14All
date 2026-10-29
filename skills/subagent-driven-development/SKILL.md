---
name: subagent-driven-development
description: Use when executing an implementation plan with mostly independent tasks in the current session, using a fresh subagent per task with a review after each and one review of the whole result at the end
---

# Subagent-Driven Development

Execute a plan by dispatching a fresh implementer subagent per task, a review of spec compliance and code quality after each, and one broad review of the whole result at the end.

**Why:** a subagent with isolated context stays focused, and your own context is kept for coordination. Never let a subagent inherit your session history; build exactly what it needs.

**Core principle:** fresh subagent per task, plus a task review, plus a final whole-result review.

## Run continuously

Do not pause between tasks to ask "should I continue?". Execute the whole plan. Decide conflicts, ambiguities and plan defects yourself, with the spec as the binding authority, and record each decision in the progress file as `Ruling: <decision> - <why> - <cost if wrong>`. Stop only for an irreversible or destructive operation, a security-sensitive action, a side effect outside the workspace that you would normally ask about first (a merge, a push to a shared branch, a publish), or a plan so broken every path forward is a guess.

## When to use

Use it when you have a plan whose tasks are mostly independent. If the tasks are tightly coupled, or the user chose to implement inline, or you have no way to dispatch subagents, use the `executing-plans` skill to implement the plan yourself in this session instead.

## Setup

1. Work in an isolated workspace (see `using-git-worktrees`). Never start implementation on main or master without the user's consent.
2. Keep a progress file in a git-ignored scratch directory. Its first line names the plan. Add one line per completed task with its commits, and every ruling. Conversation memory does not survive compaction; after a compaction, trust the progress file and `git log`, and never redo a task whose completion line exists.
3. Read the plan once, note its Global Constraints, and make one todo per task. Read the spec it names; the spec outranks the plan.
4. Before the first task, scan the plan for conflicts between tasks (a task consuming what an earlier task produces under a different name or type). Rule on each and record it.

## Model selection

Use the least powerful model that can do each role well, and always set the model explicitly when dispatching, since an omitted one inherits your session's.

- Mechanical tasks (one or two files, complete spec, plan contains the code): a cheap model.
- Integration and judgment tasks: a standard model.
- Design tasks and the final whole-result review: the most capable model.
- Reviewers: a mid-tier model as the floor, scaled to the diff's risk.

Turn count beats token price: the cheapest models take many more turns on multi-step work and can cost more overall.

## The task loop

1. **Dispatch the implementer.** Record the base commit first. The brief states where the task fits, the task text from the plan (hand it over as a file, not pasted history), the interfaces earlier tasks produced, the global constraints, and how to report. Run implementers one after another when their tasks share files, state or interfaces, because their edits would conflict. Tasks that touch disjoint files and share no state may be dispatched in parallel when the tasks share nothing, using the `dispatching-parallel-agents` skill; you then integrate the results, run the full suite, and review each task as usual. The implementer works alone: it never dispatches subagents, above all not a reviewer of its own work.
2. **Handle the report.** Statuses are DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT and BLOCKED. Answer questions fully. For concerns, decide whether they affect correctness before reviewing. For missing context, supply it. For a block, change something (more context, a more capable model, a smaller task) rather than retrying the same dispatch.
3. **Review the task.** Dispatch a fresh reviewer with the task text, the implementer's report, the diff from the recorded base to HEAD (never from `HEAD~1`, which drops all but the last commit), and the global constraints copied verbatim. The reviewer returns two verdicts, spec compliance and code quality; both are required. Do not tell a reviewer what to ignore, and do not ask it to rerun tests the implementer already ran.
4. **Fix loop.** If the review finds a spec gap or any Critical or Important issue, send the implementer the findings, have it fix them with a failing test first, and re-review only the fix diff. Cap the loop at three or four rounds. Past the cap the problem is structural: adjudicate each open finding, record a ruling, and route it (change the plan, split the task, or park it with a ruling).
5. **Complete the task.** Record its completion line with the commit range, mark the todo done, and move on. Never start the next task while Critical or Important findings are open and neither fixed nor parked with a ruling.

## Final review

When every task is complete, dispatch one reviewer on the most capable model against the whole result (diff from the starting commit), giving it the plan, the spec, the plan's Review Focus list, and your rulings. Re-grade its findings by effect on a person using the software, not by whether the spec names the input. Fix Critical and Important findings in one pass, each with a failing test first and a green suite after. Record minor findings as deferred. Then finish with `finishing-a-development-branch`.

Report to the user: every ruling you made with its cost if wrong, and every deferred minor finding.

## Common rationalizations

| Excuse | Reality |
|---|---|
| "Close enough on spec compliance" | A spec gap means not done. Fix it or hit the cap and adjudicate. |
| "I'll fix it myself, dispatching is overhead" | Fixes by the controller skip review and fill your context. Send it back to the implementer. |
| "One more round will converge" | Past the cap, rounds do not converge. Adjudicate. |
| "The fix was small, skip the re-review" | Unreviewed fixes are how regressions land. |
| "Progress-file bookkeeping is overhead" | It is what survives compaction; controllers without one have redone completed tasks. |
| "The implementer spawned its own reviewer, free assurance" | It duplicates the task review and counts for nothing. Flag it as a defect. |
