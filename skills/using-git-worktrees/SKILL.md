---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from the current workspace, or before executing an implementation plan. Ensures an isolated workspace exists, using a native worktree tool first and plain git worktrees as the fallback.
---

# Using Git Worktrees

Make sure the work happens in an isolated workspace. Detect existing isolation first, then use your platform's native worktree tool, then fall back to git. Never fight the harness.

Announce at the start: "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Step 0: detect existing isolation

Before creating anything, check whether you are already in a linked worktree:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
git rev-parse --show-superproject-working-tree 2>/dev/null   # prints a path inside a submodule
```

- `GIT_DIR` differs from `GIT_COMMON` and you are not in a submodule: you are already in a linked worktree. Do not create another. Skip to Step 2 and report the path and branch (or "detached HEAD, externally managed").
- They are equal, or you are in a submodule: this is a normal checkout. If the user has not already stated a worktree preference, ask: "Would you like me to set up an isolated worktree? It protects your current branch from changes." Honor a declared preference without asking. If they decline, work in place and skip to Step 2.

## Step 1: create the workspace

**1a. Native tool first.** If your platform has a way to create a worktree (a tool, a command, or a flag), use it and go to Step 2. Native tools handle placement, branching and cleanup. Running `git worktree add` when a native tool exists creates state your harness cannot see or manage.

**1b. Git fallback**, only when there is no native tool.

Choose the directory in this order: a location the user declared; an existing project-local `.worktrees/` or `worktrees/` (`.worktrees/` wins if both exist); otherwise `.worktrees/` at the project root.

For a project-local directory, verify it is ignored before creating anything:

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

If it is not ignored, add it to `.gitignore` and commit that change first, so worktree contents never land in the repository.

```bash
git worktree add "$LOCATION/$BRANCH_NAME" -b "$BRANCH_NAME"
cd "$LOCATION/$BRANCH_NAME"
```

If creation fails with a permission error, tell the user the sandbox blocked it, and run setup and baseline tests in place.

## Step 2: project setup

Detect the project type and install dependencies with its own tooling (a lockfile install for Node, `cargo build`, `pip install -r requirements.txt` or `poetry install`, `go mod download`). Skip it if there is no manifest.

## Step 3: verify a clean baseline

Run the project's test command. If tests fail, report the failures and ask whether to proceed or investigate; that call is the user's. If they pass, report:

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Rationalizations

| Excuse | Reality |
|---|---|
| "I am obviously not in a worktree" | Run Step 0. Harness-created isolation and submodules both fool the eye. |
| "`git worktree add` is quicker than finding a native tool" | Bypassing a native tool is the most common mistake; it creates state the harness cannot manage. |
| "The directory is surely ignored already" | Run `git check-ignore`. An unignored worktree directory commits the whole tree. |
| "The workspace is fresh, so baseline tests can wait" | A dirty baseline makes every later failure ambiguous. Run them now. |
