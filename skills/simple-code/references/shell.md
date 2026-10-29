Status: draft, not measured.

# Shell

## Simple here looks like

A short script that runs standard tools in order, with quoted variables, a clear exit status and a usage line when it needs arguments. If it grows past a screen or needs real data structures, it belongs in another language.

## Do

- Start with the shebang the project uses and, in Bash, `set -euo pipefail` when the project does.
- Quote every variable expansion: `"$name"`, `"$@"`.
- Use the standard tools for their jobs: `grep`, `sed`, `awk`, `find`, `sort`, `xargs`, `jq` for JSON.
- Check that required commands and arguments exist, and print one line of usage when they do not.
- Exit with a non-zero status when something fails, and send errors to standard error.
- Run ShellCheck, or the project's linter, before finishing.

## Do not (what agents over-build here)

- Functions and option parsers for a script that runs three commands. Instead: the three commands.
- Clever pipelines and process substitution where two plain lines read better. Instead: two lines with a named variable.
- Unquoted variables, or parsing the output of `ls`. Instead: quote, and use a glob or `find`.
- Portability layers for systems the project does not run on. Instead: target the shell the project uses.
- A script that reimplements a standard tool. Instead: call the tool.
- Colour output, spinners and logging frameworks in a utility script. Instead: plain `echo` to the right stream.

## Check before finishing

- Is every variable expansion quoted?
- Does the script stop with a non-zero status when a step fails?
- Is there a function or option parser here that a few plain lines would replace?
- Does ShellCheck, or the project's linter, pass?
