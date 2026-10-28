---
name: systematic-debugging
description: Use when you meet any bug, test failure, slow behavior or unexpected behavior, before proposing a fix. Builds a tight pass/fail loop and finds the root cause first.
---

# Systematic Debugging

Always find the root cause before attempting a fix. A fix aimed at a symptom is a failure.

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Use this for every technical issue: failing tests, production bugs, wrong output, slowness, build failures. Use it especially under time pressure, when a quick fix looks obvious, when you have already tried something, and when you do not fully understand the issue. Simple bugs have root causes too.

## Redact first

You will show commands, outputs and captured artifacts. Replace every secret with `<REDACTED>` before showing it, keep credentials in environment variables rather than in what you print, and quote only the lines that carry the signal. If the redacted output is not enough to diagnose the bug, say so and ask the user.

## Phase 1: build a feedback loop

This is the core of the skill. With a tight pass/fail signal that goes red on this bug, you will find the cause. Without one, staring at code will not save you. Spend disproportionate effort here.

Ways to build one, roughly in order: a failing test at whatever seam reaches the bug; an HTTP or CLI script run against a fixture; a headless browser script; replaying a captured request or event log; a throwaway harness around the smallest part of the system that shows the bug; a property or fuzz loop for "sometimes wrong"; an automated bisection between two known states; a differential run of old against new; and, as a last resort, a structured script that walks a human through the manual step.

Read error messages and stack traces completely, check what changed recently (diffs, commits, dependencies, config), and in a multi-component system log what enters and leaves each boundary to find where it breaks before theorizing.

Tighten the loop: faster, a sharper signal (assert the specific symptom, not "did not crash"), and deterministic (pin time, seed randomness, isolate the filesystem). For a non-deterministic bug the goal is a higher reproduction rate; loop the trigger until it reproduces often enough to debug.

If you genuinely cannot build a loop, stop and say so, list what you tried, and ask the user for access to an environment that reproduces it, a redacted captured artifact, or permission for temporary instrumentation. Do not hypothesize without a loop.

**Phase 1 is done when** you can name one command you have already run, with its output shown, that is red-capable (asserts the user's exact symptom), deterministic, fast, and runnable by you unattended. Reading code to build a theory before that command exists is the failure this skill prevents.

## Phase 2: reproduce and minimise

Run the loop and watch it fail. Confirm it shows the failure the user described, not a different one nearby, and capture the exact symptom. Then shrink the scenario to the smallest one that still fails by cutting inputs, callers, config and steps one at a time and re-running after each cut. You are done when removing any remaining element makes it pass. The minimal case becomes the regression test.

## Phase 3: hypothesise and compare

Find similar working code and list every difference from the broken code, however small. Then write three to five ranked hypotheses before testing any, each falsifiable: "If X is the cause, changing Y will make the bug disappear." If you cannot state the prediction, discard or sharpen the hypothesis. Show the ranked list to the user; they often know something that re-ranks it instantly. Do not block on an answer.

## Phase 4: instrument

Each probe maps to one prediction and changes one variable. Prefer a debugger or a targeted log at a boundary that separates hypotheses; never "log everything and grep". Tag every debug log with a unique prefix such as `[DEBUG-a4f2]` so cleanup is one search. For performance problems, measure a baseline first, then bisect; logs usually mislead.

When a test of a hypothesis fails, form a new one. Do not stack more fixes on top. If you do not understand something, say so.

## Phase 5: fix and regression test

Write the regression test before the fix, at a seam that exercises the real bug pattern. If the only available seam is too shallow to reproduce it, that is itself a finding: the architecture prevents the bug from being locked down, so report it. Otherwise: turn the minimised case into a failing test, watch it fail, apply one fix for the root cause with no "while I am here" changes, watch it pass, and run the original loop against the original scenario.

If a fix does not work, return to Phase 1 with what you learned. After three failed fixes, stop and question the architecture (shared state, coupling, each fix revealing a new problem elsewhere) and discuss it with the user before a fourth attempt.

## Phase 6: clean up

Before declaring done: the original repro no longer fails; the regression test passes, or the missing seam is documented; every tagged debug log and throwaway prototype is removed; and the commit or PR message states the hypothesis that turned out right, so the next debugger learns from it. Then follow `verification-before-completion`.

## Red flags

Stop and return to Phase 1 if you think: "quick fix for now, investigate later", "just try changing X", "it is probably X", "I do not fully understand but this might work", "one more attempt" after two failures, or if you propose a fix before tracing where the bad value comes from. If the user says "stop guessing", you skipped the evidence.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The issue is simple" | Simple issues have root causes too, and the process is fast for them. |
| "Emergency, no time" | Systematic debugging is faster than guess-and-check thrashing. |
| "I will test after confirming the fix" | An untested fix does not stick. |
| "Several fixes at once saves time" | You cannot tell which one worked, and it causes new bugs. |
| "I see the problem" | Seeing a symptom is not understanding the cause. |

If the investigation shows the cause is truly environmental or external, you have completed the process: document what you checked, add suitable handling such as a retry, timeout or clear error, and add logging for next time. Most "no root cause" cases are incomplete investigations.
