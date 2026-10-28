---
name: dispatching-parallel-agents
description: Use when facing two or more independent tasks, such as unrelated failing test files or separate subsystems, that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents

You delegate tasks to subagents with isolated context. Build exactly the instructions and context each one needs; never let them inherit your session history. This also preserves your own context for coordination.

When several problems are unrelated (different test files, different subsystems, different bugs), investigating them one after another wastes time. Dispatch one subagent per independent problem domain and let them work concurrently.

## When to use

Use it when:

- Three or more test files fail for different root causes.
- Several subsystems are broken independently.
- Each problem can be understood without context from the others.
- No shared state: the agents will not edit the same files or use the same resources.

Do not use it when:

- The failures are related and fixing one might fix others. Investigate together first.
- You need the full system state to understand the problem.
- You do not yet know what is broken (exploratory debugging).
- The agents would interfere with each other.

## The pattern

1. **Identify independent domains.** Group the work by what is broken. Each group must be fixable without touching another group's code.
2. **Write one focused brief per agent.** Each brief has a specific scope (one test file or subsystem), a clear goal, constraints ("do not change other code"), and the output you want back (a summary of the root cause and what changed).
3. **Dispatch all agents in the same response** so they run in parallel. Dispatching one per response runs them one after another.
4. **Review and integrate.** Read each summary, check that no two agents edited the same code, run the full test suite, and spot-check; agents can make systematic errors.

## What a good brief contains

- One clear problem domain.
- All the context needed: the failing test names and the error messages, pasted in.
- The method you want: understand what each test verifies, find the root cause, fix the cause and not the symptom. Say what not to do, such as "do not just raise the timeouts".
- The output format: root cause found, files changed, anything unresolved.

## Common mistakes

| Mistake | Fix |
|---|---|
| Too broad ("fix all the tests") | One test file or subsystem per agent |
| No context ("fix the race condition") | Paste the errors and test names |
| No constraints | Say what must not change, for example production code |
| Vague output ("fix it") | Ask for the root cause and a list of changes |

## Example

Six failures across three test files after a refactor: abort handling (timing), batch completion (events), and approval races (async wait). The domains are independent, so three agents are dispatched in one response. They return an event-based wait, a fixed event structure, and an added wait for async execution. The fixes do not conflict and the full suite passes.
