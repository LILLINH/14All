---
name: code-review
description: Use when completing a task or feature, before merging, when asked to review a branch, a PR or changes since some point, and when you receive review feedback. Reviews along two separate axes, standards and spec, and covers acting on feedback.
---

# Code Review

Three parts: reviewing changes along two axes, requesting a review at the right moments, and acting on feedback with technical rigor.

## Review the changes: two axes

Review the diff between `HEAD` and a fixed point the user gives you (a commit, branch, tag, merge-base, `HEAD~5`). If they gave none, ask.

- **Standards:** does the code follow this repo's documented coding standards?
- **Spec:** does the code implement what the originating issue or spec asked for?

A change can pass one and fail the other: code that follows every standard but builds the wrong thing, or does exactly what was asked but breaks conventions. Report the axes separately so one never masks the other.

### 1. Pin the fixed point

Capture the diff once with `git diff <fixed-point>...HEAD` (three dots, comparing against the merge-base) and the commit list with `git log <fixed-point>..HEAD --oneline`. Confirm the ref resolves and the diff is not empty before going further; fail here, not inside the reviewers.

### 2. Find the spec

In this order: issue references in commit messages (`#123`, `Closes #45`); a path the user passed; a spec file under `docs/` or `specs/` matching the branch or feature. If you find nothing, ask. If there is no spec, skip the spec axis and say so.

### 3. Find the standards

Collect every document that says how code should be written (for example `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `AGENTS.md`). On top of those, always apply this **smell baseline**. Each smell is a labelled judgement call ("possible Feature Envy"), never a hard violation, and a documented repo standard overrides it. Skip anything tooling already enforces.

- **Mysterious Name:** a name that does not say what it does or holds. Rename it.
- **Duplicated Code:** the same logic in more than one place in the change. Extract it.
- **Feature Envy:** a method that uses another object's data more than its own. Move it to that data.
- **Data Clumps:** the same few fields or parameters always travel together. Bundle them into a type.
- **Primitive Obsession:** a primitive standing in for a domain concept. Give the concept a small type.
- **Repeated Switches:** the same switch or if-cascade on one type recurs. Use polymorphism or a shared map.
- **Shotgun Surgery:** one logical change forces scattered edits across many files. Gather what changes together.
- **Divergent Change:** one module is edited for several unrelated reasons. Split it.
- **Speculative Generality:** abstraction or parameters for needs the spec does not have. Delete it.
- **Reinvented Wheel:** new code that does what a helper already in the repo, or the standard library, does. Use the existing one.
- **Message Chains:** long `a.b().c().d()` navigation. Hide the walk behind one method.
- **Middle Man:** a class that mostly delegates onward. Call the real target.
- **Refused Bequest:** a subclass that ignores most of what it inherits. Prefer composition.

### 4. Run both reviews in parallel

Dispatch two fresh subagents in the same response so they do not pollute each other's context.

- **Standards reviewer:** give it the diff command, the commit list, the standards files, and the full smell baseline above. Brief: "Report per file or hunk (a) every violation of a documented standard, citing the file and rule, and (b) any baseline smell, naming it and quoting the hunk. Separate hard violations from judgement calls; baseline smells are always judgement calls. Under 400 words."
- **Spec reviewer:** give it the diff command, the commit list, and the spec text. Brief: "Report (a) required behavior that is missing or partial, (b) behavior in the diff nobody asked for, (c) requirements that look implemented but look wrong. Quote the spec line for each. Under 400 words."

Each brief carries the artifact and the contract, never the author's opinion of the change or a claim that it is correct. When an input is missing (no spec, no standards file), the brief says "Spec: none provided" instead of leaving the section out, so the reviewer does not invent one. Tell each reviewer: no concrete case, no finding. A finding names an input, a state or a line where it goes wrong.

For a dedicated pass on one dimension (correctness, performance, architecture, tests, accessibility) use the `reviewer` agent; for one last checklist pass over a diff that is about to ship, the `preship-reviewer` agent; for security, the `security-auditor` agent. They read only and return findings in one format.

Without a way to dispatch subagents, do the two passes yourself, one after the other.

### 5. Report

Present `## Standards` and `## Spec` side by side, lightly cleaned. Do not merge or rerank findings across axes. End with one line: the number of findings per axis and the worst issue within each axis. Grade each finding Critical, Important or Minor, and label its evidence: `read` (quoted from the diff or the code), `inferred` (reasoned, not run) or `unverified` (could not check).

## Request a review

Request one after each task in a multi-task plan, after a major feature, and before merging. It also helps when you are stuck, before a refactor, and after fixing a complex bug. Give the reviewer a crafted brief, never your session history: what you built, what it should do (the spec or plan), and the base and head commits. Do not review a large diff inline yourself; that burns the context you need to keep working.

Act on the result: fix Critical issues immediately, fix Important issues before moving on, note Minor ones. If the reviewer is wrong, push back with technical reasoning and the code or tests that show it. Never skip review because the change is simple.

## Receive feedback

Evaluate feedback technically; do not perform agreement. Verify before implementing, ask before assuming.

1. **Read** all the feedback without reacting.
2. **Understand** each item; restate it in your own words or ask.
3. **Verify** it against the codebase.
4. **Evaluate** whether it is sound for this codebase.
5. **Respond** with a technical acknowledgment or reasoned pushback.
6. **Implement** one item at a time and test each.

Rules:

- If any item is unclear, stop and ask about it before implementing anything; items are often related and a partial understanding gives the wrong result.
- No performative agreement ("You're absolutely right!", "Great point!", thanks). State the fix or the requirement instead. When feedback is right, just fix it and say what changed.
- Feedback from the user is trusted once understood; ask if scope is unclear. Feedback from other reviewers needs checking: is it correct for this codebase, does it break existing behavior, is there a reason for the current code, does the reviewer have the full context? If it conflicts with a decision the user already made, stop and discuss it with them first.
- If a reviewer asks you to implement something "properly", search the codebase for actual use. If nothing uses it, ask whether to remove it (YAGNI) instead of building it.
- Order of work: clarify first, then blocking issues (breakage, security), then simple fixes, then complex ones, testing each and checking for regressions.
- Push back when a suggestion breaks existing behavior, the reviewer lacks context, it violates YAGNI, it is wrong for this stack, or it conflicts with the user's architectural decisions. Use technical reasoning, not defensiveness. If you pushed back and were wrong, say so factually and move on without a long apology.
- If you cannot verify a suggestion, say so and ask how to proceed.
- When replying to inline comments on a hosted pull request, reply in the comment thread, not as a new top-level comment.
