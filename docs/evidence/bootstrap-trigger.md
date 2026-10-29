# Evidence: does the bootstrap make the model invoke a skill

Date: 2026-10-29. Claude Code 2.1.312, headless, one fresh scratch directory per run holding only a link to a folder of extracted game assets. The user's own plugins were left out (`--setting-sources project,local`); the plugin was loaded with `--plugin-dir`. Each run was cut at 6 turns, so this measures only what the model does first, not how a build ends.

## Question

On a request to build something new, does the model invoke `brainstorming` and ask before it writes anything?

Prompt: "Thư mục này chứa asset giải nén từ game DragonBoy250 (...). Tôi muốn làm một game đơn giản chơi được trên trình duyệt từ asset đó (HTML và JavaScript thuần, mở index.html là chạy, không cần build hay server). Hãy tạo game trong thư mục con `game_v2/` và không sửa gì trong DragonBoy250_assets."

## Why it was measured

Two full builds of a small game, with and without 14All (the released bootstrap), ended about the same: neither invoked a skill, neither asked a question, and the cost and time were close. Only one run per side, so that comparison shows nothing either way. The short runs below measure the part that decides whether a skill can help at all.

## Results

| Bootstrap | Runs | Any skill | `brainstorming` | `simple-code` instead | Skill was the first action | Asked before writing a file |
|---|---|---|---|---|---|---|
| No plugin | 3 | 0 | 0 | 0 | 0 | 0 |
| Released (0.1.0) | 13 | 9 | 6 | 3 | 9 | 2 |
| Changed (below) | 12 | 12 | 12 | 0 | 12 | 8 |

Cost per run stayed near 0.08 to 0.09 USD in all three.

The change: the rule now says that when a skill might apply, invoking it is the first action, before listing a directory, reading a file, running a command or asking a question, and that a small question or a one-line command needs no skill. The priority list now names "a game, a page, an app, a script, a feature" under building something new, says `brainstorming` comes first even when the request looks clear, and says `simple-code` comes later, when the code is written.

A first wording that named the tool ("your first tool call is the Skill tool") gave the same trigger rate but also invoked a skill for 4 of 6 runs of "run ls and tell me how many entries", and it broke the rule that skill text names actions, not tools. The wording in the repository replaced it; on that `ls` prompt it invoked a skill 0 of 6 times, the same as the released text. A plain question about `let` and `const` invoked none in 6 runs with the released text and with the first wording.

## What this does not show

- That the build ends better. Runs stopped at 6 turns, and the answers to the questions were never given. Whether a design agreed first gives a better game, or costs more in a real session, was not measured.
- Other kinds of request. One build prompt, one trivial command and one plain question were tried.
- That the effect lasts on other models or other Claude Code versions. One model, one version.
- Codex. Nothing here was run there.
- Small samples: 12 to 13 runs per row. The gap is large (6 of 13 against 12 of 12 for `brainstorming`) but the exact rates are not precise.
- Evaluations E1 to E4 were not re-run with the changed text.
