---
name: verification-before-completion
description: Use when about to claim work is complete, fixed or passing, and before committing or opening a PR. Requires running the verifying command and reading its output before any success claim.
---

# Verification Before Completion

Evidence before claims, always.

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you have not run the verifying command in this message, you cannot claim it passes.

## The gate

Before claiming any status or expressing satisfaction:

1. **Identify** the command that proves the claim.
2. **Run** the full command, fresh.
3. **Read** the full output, check the exit code, count the failures.
4. **Compare** the output to the claim. If it does not confirm it, state the actual status with the evidence.
5. **Only then** make the claim, with the evidence attached.

Skipping a step is not verifying.

## What each claim requires

| Claim | Requires | Not sufficient |
|---|---|---|
| Tests pass | Test command output showing 0 failures | An earlier run, "should pass" |
| Linter clean | Linter output showing 0 errors | A partial check |
| Build succeeds | Build command with exit code 0 | The linter passing |
| Bug fixed | The original symptom now passes | "I changed the code" |
| Regression test works | A red-green cycle: it passes, you revert the fix, it fails, you restore the fix, it passes | It passed once |
| A subagent finished | The diff shows the changes and you checked them | The subagent said "success" |
| Requirements met | A line-by-line check against the spec or plan | The tests passing |

For requirements: re-read the plan or spec, make a checklist, verify each item, then report the gaps or the completion.

## Red flags

Stop if you are about to use "should", "probably" or "seems to"; express satisfaction ("Great!", "Done!") before verifying; commit, push or open a PR without verifying; trust an agent's success report; rely on a partial check; or feel tired and want it over. Different wording does not exempt you: any phrase that implies success before you ran the check is covered.

## When it applies

Always before any success or completion claim, any positive statement about the state of the work, committing, opening a PR, finishing a task, moving to the next task, and handing work to or accepting work from a subagent.
