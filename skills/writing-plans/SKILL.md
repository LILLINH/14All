---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Produces a task-by-task implementation plan another engineer or agent can execute without asking you anything.
---

# Writing Plans

Write the plan for an engineer who has not seen this codebase or this spec. Assume they write idiomatic code once they know the exact interface and the exact test, and that they make a reasonable choice wherever the plan leaves one open. What they cannot know is what you decided: which files, which names and signatures, which values from the spec, which tests prove each task. Document those. Use bite-sized tasks. DRY. YAGNI. Test first. Commit often.

Announce at the start: "I'm using the writing-plans skill to create the implementation plan." Save the plan to `docs/plans/YYYY-MM-DD-<feature-name>.md` unless the user prefers another place.

## Scope check

If the spec covers several independent subsystems, suggest one plan per subsystem. Each plan should produce working, testable software on its own.

## File structure

Before defining tasks, map which files are created or changed and what each is responsible for. Give each file one clear responsibility and well-defined interfaces. Prefer small focused files. Files that change together live together. In an existing codebase follow its patterns.

## Task right-sizing

A task is the smallest unit that carries its own test cycle and is worth a separate review. Fold setup, configuration and documentation into the task whose deliverable needs them. Split only where a reviewer could reject one task and approve its neighbor. Each task ends with an independently testable deliverable.

## Steps

Each step is one action with a checkable result: write the failing test, run it and see it fail, implement the minimal code, run it and see it pass, commit. A step is done when the implementer can write exactly one reasonable thing from it:

- **Test step:** the test's name and assertions as code, with the spec's exact values.
- **Code step:** the exact signature, the file, and the values the spec pins. The implementer writes the body. Show a body only for an algorithm the signature and tests do not determine.
- **Verification step:** the command and the output that means it passed.
- **Reference to another task:** point to that task's Interfaces block; do not repeat its code.

Lines that decide nothing ("TBD", "handle edge cases", "add appropriate validation", "write tests for the above") are a defect. So is a plan that writes the code out in full.

## Plan header

Start every plan with:

```markdown
# [Feature] Implementation Plan

**Goal:** one sentence.
**Architecture:** 2 to 3 sentences.
**Tech stack:** key technologies.
**Spec:** path to the design doc this plan implements.

## Global Constraints
The spec's project-wide requirements, one line each, exact values copied from the spec.

## Review Focus
Up to five input classes or failure modes the spec implies but no task's tests exercise, most likely to hurt a user first. Each line names the input and the behavior a reasonable person expects. Add the test that pins each one to the task that owns the code.
```

Each task then lists **Files** (create, modify, test), **Interfaces** (what it consumes from earlier tasks and what it produces for later ones, with exact signatures), and its checkbox steps.

## Self-review

Run this yourself after writing the plan:

1. **Spec coverage:** can you point to a task for every requirement? Add missing tasks.
2. **Step scan:** every step allows exactly one reasonable implementation, and none carries more than that.
3. **Type consistency:** names and signatures in later tasks match their definitions in earlier ones.
4. **Review Focus:** every listed failure mode has a test in a task.
5. **Proportion:** a plan several times longer than its spec is a transcript of the program. Replace bodies with signatures, test names and assertions.

Fix what you find inline.

## Handoff

Link the saved plan and ask the user to review it. Offer two ways to execute it:

- **Subagent-driven:** a fresh subagent implements each task and a fresh reviewer checks it before the next starts, then one review of the whole result. Most thorough; costs a fresh context per task and review. Use the `subagent-driven-development` skill.
- **Inline:** you implement every task yourself in this session, test first, keep a progress file of finished tasks, then request one fresh review of the whole result with the `code-review` skill. Cheaper and faster; no independent review until the end.

Recommend one with a single sentence of reasoning drawn from the plan (how much the tasks depend on each other's interfaces, how many there are, what a shipped mistake would cost), and ask which the user wants.
