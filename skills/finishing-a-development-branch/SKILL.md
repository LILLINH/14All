---
name: finishing-a-development-branch
description: Use when implementation is complete and the tests pass, and you need to decide how to integrate the work. Verifies the tests, then presents merge, pull request or keep options and carries out the choice.
---

# Finishing a Development Branch

Verify the tests, detect the environment, present the options, carry out the choice, clean up.

Announce at the start: "I'm using the finishing-a-development-branch skill to complete this work."

## Step 1: verify tests

Run the project's full test suite on the tree you are about to integrate. An earlier green run proves only the tree it ran on. If tests fail, show the failures and stop; the menu comes after a green suite.

## Step 2: detect the environment

While still inside the workspace, capture:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

| State | Menu | Cleanup |
|---|---|---|
| `GIT_DIR` equals `GIT_COMMON` (normal repo) | 3 options | no worktree to clean up |
| Different, on a named branch | 3 options | see Step 6 |
| Different, detached HEAD | 2 options (no merge) | externally managed, leave in place |

## Step 3: confirm the base branch

The base is whatever this work forked from, usually named in the plan, the conversation or the branch's upstream. If you are not sure, ask "This branch split from <your best guess>, is that correct?" Merging into the wrong base is expensive to undo.

## Step 4: present the options

Present exactly these, concisely, and wait. Integration is the user's decision.

Normal repo or named-branch worktree:

1. Merge back to `<base-branch>` locally
2. Push and create a pull request
3. Keep the branch as is (I will handle it later)

Detached HEAD:

1. Push as a new branch and create a pull request
2. Keep as is

Never offer to discard on your own. Discarding happens only when the user asks for it in so many words (see below).

## Step 5: carry out the choice

**Option 1, merge locally.** From the main repository root: check out the base, pull, merge the feature branch, then run the tests on the merged result. If they fail, stop, leave the branch and worktree in place, and investigate; nothing has been pushed. If they pass, clean up the worktree (Step 6), then delete the branch with `git branch -d`.

**Option 2, push and create a PR.** `git push -u origin <feature-branch>` (from a detached HEAD name the new branch: `git push origin HEAD:refs/heads/<new-branch>`). Create the pull request against the base with the forge's tooling, following the repo's PR template and conventions (the `pr` skill covers the body), and report the URL. Keep the worktree; PR feedback gets fixed there. A rejected push means the remote moved: investigate, and force-push only if the user explicitly asks.

**Option 3, keep.** Report "Keeping branch <name>. Worktree preserved at <path>." Change nothing.

**Discard, only on an explicit request.** Confirm first by listing exactly what will be deleted (the branch, its commits, the worktree path) and require the user to type the word `discard`. Nothing less counts. Then clean up the worktree and force-delete the branch with `git branch -D`.

## Step 6: clean up the workspace

Runs for Option 1 and for confirmed discards. Options 2 and 3 keep the worktree. Run it from the main repository root, using the values captured in Step 2.

- Normal repo: nothing to clean up.
- `WORKTREE_PATH` is under `.worktrees/` or `worktrees/`: we created it, so remove it with `git worktree remove "$WORKTREE_PATH"` and then `git worktree prune`.
- Anywhere else: the host environment owns it. Leave it in place.

If removal is refused because the worktree has modified or untracked files, those files exist nowhere else. Never force it on your own. Show the user `git -C "$WORKTREE_PATH" status --porcelain -uall`, and offer: commit them to the branch first, move them into the main repo, or delete them (unrecoverable). Do what they choose, then remove the worktree. Never clean up a worktree that is not under `.worktrees/` or `worktrees/`.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Tests passed earlier this session" | Run the suite on the tree you are about to integrate. |
| "They obviously want it merged" | Present the menu and wait. |
| "They seem done, I will offer to discard" | Discard only when they ask in so many words. |
| "'Yeah, get rid of it' counts as confirmation" | Only the typed word `discard` authorizes deletion. |
| "The PR is up, so the worktree is clutter" | PR feedback is fixed there. It stays until the work lands. |
| "Removal was refused, so force it" | The refusal means files exist only there. Show the user and ask. |
| "The failing merged result is probably flaky" | A failing merged result stops everything. Investigate. |
| "The base branch is obviously main" | Confirm the fork point or ask. |
