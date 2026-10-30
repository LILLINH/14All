# Evidence: when does the bootstrap make the model invoke brainstorming, and what does it cost

Dates: 2026-10-29 and 2026-10-30. Claude Code 2.1.312, headless. Each run used a fresh scratch directory. The user's own plugins were left out (`--setting-sources project,local`); the plugin was loaded with `--plugin-dir`. Two prompts: a small build ("make a simple browser game from the extracted game assets in this folder, in `game_v2/`") and a large, vague change to an existing app (evaluation E1, "Add notifications to this app.").

## What was found, in order

1. **The released text (0.1.0) rarely made the model use a skill on the small build.** In short runs cut at 6 turns, it invoked `brainstorming` 6 of 13 times, and `simple-code` 3 of 13. Without the plugin: 0 of 3.
2. **A first change forced `brainstorming` for every "new" thing.** It invoked it 12 of 12 times, and the model asked before writing a file. A full run, with a simulated user who held eight hidden wishes (genre, three lives, keyboard only, high score, music with a mute key, a self-contained folder, no stray files), compared with no plugin:

   | Six runs each | No plugin | Forced brainstorming |
   |---|---|---|
   | Cost to a finished game | 0.37 USD | 0.53 USD (+45%) |
   | Output tokens | 17.2k | 18.7k (+9%) |
   | Cache-read tokens | 670k | 1.03M (+54%) |
   | Fit to the eight wishes (3 judged runs each) | 5, 5, 4 of 8 | 8, 8, 8 of 8 |

   The game was better fitted because the assistant asked one question and the simulated user then gave all eight wishes; the no-plugin games guessed the genre (two scrolled vertically, one was a platformer), used 5 hit points instead of 3 lives, and added mouse control. It cost more because of the extra turns, not because of more writing.
3. **The user ruled that small tasks need no brainstorming.** The text now says a small task (one self-contained thing, cheap to redo, nothing else depends on it) gets no brainstorming and no plan: state the assumptions in one line, build, check, say how to change course. Larger or vaguer work, such as a feature in an existing app, still goes through `brainstorming`.

## Results of the text in the repository now

| Prompt | Runs | No plugin | This text |
|---|---|---|---|
| Small build: invoked `brainstorming` | 12 | not run | **0 of 12** (7 runs invoked `simple-code`) |
| E1, large and vague: asked before writing a file | 8 (4 without the plugin) | 0 of 4; all 4 built straight away | **8 of 8**, none wrote a file first |
| Small build, full run, cost to a finished game | 3 (6 without) | 0.37 USD on average (0.27 to 0.59) | **0.26 USD** (0.24 to 0.29) |
| Small build, full run, fit to the eight wishes | 3 (3 judged without) | 5, 5, 4 of 8 | 4, 4, 3 of 8 |

So on a small task the plugin now behaves like no plugin: same fit, and a cost that is no higher. On a large vague task it asks first, as the earlier evaluations (E1) showed.

## A regression found on the way, and its fix

Re-running the four evaluations on 2026-10-30 (14All mode only) showed that **E3 (implement a function from a spec, test first) no longer passed**: 0 of 3 with the text of that day, and 1 of 4 with the released 0.1.0 text. In those runs the model invoked only `simple-code`, which was added on 2026-10-29, after E1 to E4 were first measured, and wrote the implementation before any test; `test-driven-development` was invoked in 1 of 4 released-text runs. `simple-code` is described as "about to write or change code in a project", broader than the test-first skill, so it took the one skill slot.

The bootstrap now says that for code with behavior to check, `test-driven-development` comes first and then `simple-code`, and that both are invoked; it also says the other skills still apply to a small task. After that, on 2026-10-30:

| Task | What it checks | Runs passed |
|---|---|---|
| E1 | asks before building | 3 of 3 |
| E2 | finds the cause before fixing | 3 of 3 |
| E3 | test first | **8 of 8** |
| E4 | does not claim done unmeasured | 3 of 3 |

The baseline was not run again that day; the figures for no plugin are from 2026-10-28. The saved summaries are in `evals/runs/2026-10-30/`.

## What this does not show

- That the lower cost is real. Three runs against six, with a range of 0.26 to 0.59 USD for no plugin; the difference is within that spread.
- That asking first pays off in real use. The simulated user answered one open question with all eight wishes at once, which a real user may not do. The fit figures come from a model reading the source code, not from playing the games, and no game was opened in a browser for this comparison.
- The first three runs of each arm in the cost table were lost when the machine restarted; only their costs and token counts were read before that. The fit of those runs was not judged.
- That E1 to E4 pass for the reasons they were written for in other situations. Three runs each (eight for E3), automatic graders only, one model.
- One model, one Claude Code version, one small-build prompt. Codex was not tried.
