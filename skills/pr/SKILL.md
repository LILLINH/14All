---
name: pr
description: Use when writing the body of a pull request. A short template with a visual summary, before and after evidence, and a merge danger assessment.
---

# Writing a PR Body

Use this template. Skip preambles and keep the prose brief. Use the project's own domain language.

```markdown
## Summary

<diagram, diff sketch, or tree>

## Evidence

- **Before:** <screenshot, output, or failing test run>
  **After:** <screenshot, output, or passing test run>

## Merge Danger

**Door:** <one-way or two-way>

<optional: a short description>

**Blast radius:** <one-word description>

<optional: possible ramifications of merging>
```

## Summary

Pick the smallest view that makes the key point clear, and put each visual next to the short text it supports. Keep only the calls, files, props, states and boundaries needed to answer what the reviewer is asking. You will rarely use more than one or two of these:

- **Pseudocode** for logic or an algorithm.
- **A call tree** for runtime control flow (`submitForm` with its calls indented beneath it).
- **A component tree** for UI structure, including the state and module boundaries that matter.
- **A shallow file tree** with one-line comments for file responsibility or a broad refactor.
- **A Mermaid diagram** for interaction or data flow between components.
- **A diff** when the point is what changes and the surrounding shape already exists. Shape the diff like the topic: a component tree diff, a file layout diff, a call tree diff, or a control-flow diff.
- **The whole block** when most of it is new, when leaving out context would hide ownership or order, or when the reviewer needs a copyable target shape.

## Evidence

Concrete proof that the change works, as a before and after. A screenshot is the strongest evidence when the change is visual and the environment allows one. Execution evidence is next: test results and console output. Show the exact test that now passes and failed before, in pseudocode if that is clearer.

Run the checks yourself before you quote them (see `verification-before-completion`).

## Merge Danger

Say whether the change is a one-way or two-way door. A two-way door can be walked back; a PR that is cheap to roll back is lower risk. Destructive actions and hard-to-reverse decisions make it a one-way door.

The blast radius is the scope of what could be affected: breakage for consumers, layout shift, mobile responsiveness, data migrations, and so on. Consider all the possibilities, then name the main one in a word.
