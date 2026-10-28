---
name: brainstorming
description: Use before any creative work such as building a feature, changing behavior, or planning something new, and whenever the user wants to stress-test a plan, decision or idea (grilling). Finds out what they actually want and why before anything is built.
---

# Brainstorming

You are good at building. You build what you believe the user wants, and that belief is usually thinner than it feels. This skill finds out what they actually want, and why, before anything gets built. When you understand the why, you make the hundred unmentioned decisions the way they would have.

## First: what do you actually know?

- **Everything that matters is in the request** ("make the icon cornflower blue"). It is a quick, clear task. Do it and say what you did.
- **Something non-trivial is missing.** Start the conversation below.

Before implementing anything non-trivial, do these in order:

1. Lay out the approaches in a message of their own and let the user pick one.
2. Write the design doc, short or full.
3. Get the user's approval of that doc.
4. Invoke the `writing-plans` skill.

A spike the user said yes to, and doing what they asked after they opt out of questions, are not "implementing".

## Look before you ask

In an existing project, or when the user gave context (a spec, files, an earlier conversation), read it first. Keep reading until you can explain how the relevant parts work today and what the change would touch. Never ask what the project already answers.

## Your first message

- **They already said what they want:** about 200 words. Echo the request back in your own words (what, for whom, why, as far as they said it), add what you found that bears on it, flag anything that would change what they are asking for, then ask the one question whose answer would most change what gets built.
- **They have not:** one open question, in their terms, about the biggest unsettled thing, with the reason you ask.

If the user did not ask for brainstorming, add one line offering to just get going instead. If they take it, state any significant how-it-gets-made choice (platform, language) in one plain line and do the work through the normal workflow.

## The conversation

- Each message ends with one question: a single sentence, no list of example answers.
- Get them describing first. Offer a short menu only when they are stuck. When they say "just guess", propose something concrete.
- Make each question specific to their project and build it on their last answer or on something you found.
- Finding facts is your job, never theirs. Look up what you can; ask only for decisions. When a fact needs exploring, dispatch a subagent and keep asking the questions that do not depend on it.
- Find out which how-it-gets-made choices (platform, language, libraries) they want to make and which they hand to you. Say your defaults out loud and record them in the design as your calls, never as something they agreed to.
- Territory to cover, never read out as questions: what this is and what makes it special; why now and what success looks like; goals, non-goals and anti-goals; prior art; current state; details they care about.

### Grilling mode

When the user wants a plan or idea stress-tested, treat it as a design tree. The frontier is every open decision whose prerequisites are settled. Ask the whole frontier in one numbered round, each question with your recommended answer, then wait. Each answer reshapes the tree, so recompute the frontier and ask the next round. A question that depends on another open one belongs to a later round. You are done when the frontier is empty and nothing is silently assumed. Do not act on the result until the user confirms you share an understanding.

## Play it back

As soon as you understand one part, describe it back in about 200 to 300 words, then return to questions about the next part. Mark your guesses as guesses; only what they said goes in as theirs. End each chunk by asking what is wrong or missing.

## Lay out the approaches

Once you understand what they want, and before writing anything up, put the ways of building it in a message of its own. Think of several real alternatives and drop the weak ones. Present the two or three that remain, grounded in what the project does, with what each trades off. Recommend one and say why, then ask which way they want to go. If there is genuinely one sensible way, say so and why the others do not fit.

## Size the work

| Size | The design doc |
|------|----------------|
| A small change | a short one: what you covered, written down |
| A project | the full written design |

If it grows mid-task, stop, say so, and step up a size. If it is really several independent projects, agree on an order and brainstorm them one at a time.

## The written design

Write a document a skilled builder could plan from without going back to the user. Cover intent and the why; goals, non-goals and anti-goals; constraints; the approaches considered and the one chosen; the decisions the user made, as they made them; your own calls, marked; and what is left to the builder. In a software repo save it as `docs/specs/YYYY-MM-DD-<topic>-design.md`. The user's preference for location wins.

For a project, run a builder check before handing it over. Dispatch a fresh subagent with this brief: "You are a skilled engineer handed this design to plan a build from. You cannot talk to its author. Read <path>. Report only the questions you would still need answered, where a wrong guess would matter, each with why it changes the plan, ranked by importance. Skip what the document leaves to the builder. If nothing important is left, say so." Sort what comes back: answered by the conversation (put the answer in the doc), minor (settle it and mark it your call), or the user's (bring them together in one message). Without a subagent, read the doc as that builder yourself.

<HARD-GATE>
Nothing gets built until the user approves the design doc. Building includes writing product code, scaffolding, installing dependencies, and creating projects. Reading and exploring are fine. After approval the next step is `writing-plans`.
</HARD-GATE>

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll offer a menu of what they might want" | Options steer. Ask them to describe it first. |
| "I'll fill in sensible defaults" | Good. Say them out loud so they can reject them. |
| "I have my answers, I'll write the doc" | Lay out the approaches first, in a message of their own. |
| "They said 'sounds good' to the idea" | Approval covers what you showed them. An unwritten design is not approved. |
| "The spike works, I'll keep building on it" | Keeping a spike is a new request. Back through the gate. |
