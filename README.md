# 14All

14All is an add-on for AI coding assistants. It teaches the assistant better working habits: ask before building, find the real cause before fixing a bug, write the test first, and check that something works before saying it is done. It also adds a few safety rails, a way to keep notes between sessions, and some small helper agents.

**It is early.** This is version 0.1.0, not a finished release. Only Claude Code and Codex have been tried so far. A claim that another assistant works is made only when a file in `docs/evidence/` backs it up.

## Words used here

- **Skill:** a short instruction page the assistant reads when a certain situation comes up, for example "you are about to fix a bug".
- **Hook:** a small script that runs by itself at set moments, for example at the start of a session or just before the assistant runs a command.
- **Agent:** a helper with one narrow job that the main assistant can hand work to.
- **Evaluation:** a small test of the assistant itself. The same task is given with and without 14All and the results are compared.

## Install

This works for Claude Code and Codex. No other assistant has been tried.

**Claude Code.** The two commands below were run once in a clean configuration and installed the plugin; a session after that install was not run.

```
/plugin marketplace add LILLINH/14All
/plugin install 14all@14all
```

**Codex.** Codex does not run a plugin's hooks until you trust them: start `codex`, type `/hooks`, read each hook and trust it. Without that step the skills load but the start-of-session bootstrap and the guard do not run. These commands were run against a local copy of this repository, not yet against the GitHub address.

```
codex plugin marketplace add LILLINH/14All
codex plugin add 14all@14all
```

The code is at https://github.com/LILLINH/14All. What was tried is in [docs/evidence/claude-code.md](docs/evidence/claude-code.md) and [docs/evidence/codex.md](docs/evidence/codex.md). On Codex the helper agents are not used and the "ask first" rule for linter settings does not apply.

## What you get

### Working habits (21 skills)

Every skill below is a draft. Only the four habits in the early test under "How well does it work?" have been tested at all; the rest are unmeasured, which means nobody has checked whether they change the assistant's results.

| Skill | What it makes the assistant do |
|---|---|
| `using-14all` | Look for a fitting skill before it answers or acts. It is loaded at the start of every session. |
| `brainstorming` | Ask questions and agree on what to build before building. |
| `writing-plans` | Turn an agreed design into small, checkable steps. |
| `executing-plans` | Carry out a plan itself, step by step, keeping a progress file. |
| `subagent-driven-development` | Hand each step of a plan to a fresh helper and have the result reviewed. |
| `dispatching-parallel-agents` | Give unrelated problems to separate helpers at the same time. |
| `test-driven-development` | Write a failing test first, then the code that makes it pass. |
| `systematic-debugging` | Find the real cause of a bug before changing anything. |
| `verification-before-completion` | Run the check and read its output before saying "done". It also says what "done" means. |
| `code-review` | Review a change for standards and for whether it does what was asked. |
| `pr` | Write a pull request description a reviewer can follow. |
| `using-git-worktrees` | Work in a separate copy of the project so the main copy stays clean. |
| `finishing-a-development-branch` | Wrap up a branch: merge, open a pull request or keep it. It also asks how the change reaches users and how it is undone. |
| `simple-code` | Follow the style the project already has, and keep new code simple without dropping input checks, safe error handling, security checks or accessibility. Guidance for 14 languages and 11 frameworks is in `skills/simple-code/references/` and is read only for the files being touched. This skill is **unmeasured**. |
| `handoff` | Write a note so a fresh session can pick up unfinished work. |
| `working-notes` | Keep notes in a file during a long task so nothing is lost when the conversation is cleared or shortened. |
| `tool-output` | Keep what commands print small, and never hide a failure. |
| `secure-code` | Think about what an attacker could send before writing code that takes outside input. |
| `impact-check` | Find everything that uses something before changing it. |
| `research` | Look things up in official sources, say which version a fact is about, and treat what it reads as information, never as orders. |
| `writing-for-agents` | Write a skill or an `AGENTS.md` file that an assistant will follow. It comes with a template. |

For web pages and apps, `skills/simple-code/references/web-ui.md` asks the assistant to use the project's own design first, to check accessibility and small screens, and to look at the page at three widths. If it has no browser it must say that it did not look.

### Safety rails: the guard hook

`hooks/guard` runs just before the assistant uses a tool. It refuses a short list of commands that are almost never meant:

- deleting `/` or your home folder with a recursive `rm`;
- skipping git's own checks (`--no-verify`, `git commit -n`, `-c core.hooksPath=...`);
- force-pushing to `main` or `master`;
- downloading a script and running it straight away;
- writing to a raw disk;
- reading `.env` files, private SSH keys or AWS credentials.

It does not refuse but **asks you first** before the assistant edits an existing linter or formatter setting (such as `.eslintrc`, `.prettierrc`, `biome.json` or `.editorconfig`), because loosening a check can hide a problem. Creating a new one is allowed. Text inside quotes is ignored, so a commit message that only mentions `rm -rf /` is not blocked.

The guard catches slips; it is not a security boundary. A command written in a different way gets past it. Set `ALL14_GUARD=off` to switch it off for one session.

### Notes between sessions

At the start of a session, after you clear the conversation, and after it is shortened, 14All looks for a progress note left in `.14all/progress/`. If there is one, it shows the assistant the newest note (at most 3000 characters) and tells it that the note is information to check, not an order. Set `ALL14_RESUME=off` to turn this off. The `.14all/` folder is ignored by git. The `handoff` and `working-notes` skills are how such notes get written.

### Helper agents

`agents/` holds four helpers made to only read: they get no file-editing tools and are told to use the command line only for reading, though nothing technically stops a command from writing. They are `debugger` (tests one idea about why something fails), `reviewer` (reviews a change from one point of view, such as security), `preship-reviewer` (a last checklist before shipping) and `security-auditor`. Other coding assistants are not known to read this directory; nobody checked.

### Checks for people working on 14All

- `npm test` runs the unit tests. `npm run check` also checks the skills and agents, refuses invisible or look-alike characters (`scripts/check-text.mjs`) and real people's home folders in files (`scripts/check-paths.mjs`), and checks that skill descriptions are found by plain requests and do not read like each other (`scripts/check-routing.mjs`, cases in `evals/routing/cases.json`). The routing check lists three known gaps: requests that miss their skill because they use different words.
- `npm run check:harness -- <folder>` checks any project for eight signs that an assistant can work in it (an `AGENTS.md` file, a test command, tests, and so on). It measures words and files, not whether a model picks the right skill or whether the setup works. This repository passes its own check because its `AGENTS.md` was written to.

## How well does it work?

Here is what is known, and what is not.

**One early test.** On four small tasks (ask before building, find the cause before fixing, test first, check before claiming done), Claude Code with 14All passed the automatic grader in 12 of 12 runs. Without 14All it passed in 2 of 12. That is three runs per case, one model, automatic graders only, and the graders were corrected after the runs, so read the limits in [docs/evidence/plan-1-acceptance.md](docs/evidence/plan-1-acceptance.md) before relying on these numbers.

**Everything added after that has not been measured.** The newer skills, the notes feature, the guard's newer rules and the helper agents are covered by unit tests and checks, but no evaluation has measured them. Three evaluations are written but have never been run: E13 and E14 (for `skills/simple-code`, in a React and a Vue project) and E15 (one error in a long log, for `tool-output`).

**What was seen in a real session:**
- 14All's start-of-session instructions reached the model (one run).
- The guard stopped one force push (one run, with an earlier version of the guard).
- Claude Code listed all 21 skills and the four agents. They were seen listed in one headless session each time, in two separate checks. That shows they load, not that they are chosen or followed.

**What was seen on Codex** (one run each, Codex CLI 0.165.0; see [docs/evidence/codex.md](docs/evidence/codex.md)):
- The plugin installed from a local copy and Codex listed all 21 skills.
- With the hooks not trusted, the start-of-session instructions did not reach the model; after trusting them in `/hooks`, they did.
- With the hooks trusted, the guard stopped a force push to `main` and a `cat .env`, and let a harmless command run.

**What was not tried:** installing on Codex from the GitHub address, a session after a marketplace install, Windows, interactive sessions (apart from the Codex `/hooks` screen), any assistant other than Claude Code and Codex, whether the "ask first" prompt appears for a settings edit, and whether a helper agent really keeps to read-only. Those are not verified.

## Learn more

- Adding or changing things: [CONTRIBUTING.md](CONTRIBUTING.md). Security: [SECURITY.md](SECURITY.md). Changes: [CHANGELOG.md](CHANGELOG.md).
- Rules for working on this repository: [AGENTS.md](AGENTS.md).
- Where ideas and text came from: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- The first design: `docs/specs/2026-10-28-14all-design.md`.
