---
name: simple-code
description: "Use when about to write or change code in a project. Learns how the project already writes code (its written rules first, then its habits), follows them for style, and keeps the new code simple enough for a person to read and maintain, using per-language and per-framework references."
---

# Simple Code

Write the code an experienced senior developer would write: plain enough that a person can read it and maintain it. Match the project you are in; do not copy its needless complexity.

## The routine

0. **Scale the effort to the change.** The full routine is for new code or a real change. For a one-line fix or a configuration tweak, skip it: look at the file you are editing and match it. A generated or lock file is regenerated with its tool when there is one, not edited by hand. Generated and vendored code is never a source of conventions.
1. **Find what you are in.** From the files you are about to touch, work out the language and framework (file extensions, `package.json` dependencies, `pyproject.toml`, `go.mod`, `pom.xml`, `composer.json`, and the like). Read only the matching entries under References. In a monorepo or a project in several languages, choose by the files you touch, not by the repository as a whole.
2. **Learn the project's conventions before writing.** Always read the project's written rules first (`CONTRIBUTING`, `CLAUDE.md`, `AGENTS.md`, style docs). Then read, and stop when the picture is clear: formatter and linter configuration (`.editorconfig`, ESLint, Prettier, ruff, golangci-lint, and similar); two or three files closest to what you will write, plus one test file. Never read generated, vendored or lock files for this. Note for yourself, in a few lines: naming, file and folder layout, formatting, the style of error handling and of tests, how much is commented. Keep two kinds of finding apart: **written rules** (anything the project states in its rule files, style docs or lint configuration) and **habits** (what the code happens to do).
3. **Follow written rules; follow habits only for style, not for complexity.**
   - A written rule wins, even when it asks for structure the rules below would avoid (a repository layer, a service per endpoint, a state library). It is the team's or the user's instruction. If it makes a small job heavier, do what it says and add one sentence to your final report naming the rule. A direct request from the user beats a written rule.
   - A habit is followed for style: naming, layout, formatting, how errors and tests are written. It is not followed for structure. Layers, wrappers, patterns and indirection that exist only because older code has them are not copied.
   - When existing code is more complicated than the job needs and no written rule asks for it, write the new code the simple way, leave the old code alone, and say so in one sentence in your final report.
   - If there is no linter, no configuration, no written rules and no similar file to learn from, use the defaults in the matching reference. Where the project gives no answer on a point, use the matching reference's default for that point.
4. **Write the simple version first.** Apply the rules below.
5. **Check before saying done.** Could this be shorter without losing meaning? Is every new name, file, parameter and dependency needed by the task as asked? Would a new teammate follow it on first read? Did I cut anything from the never-trade list in Rules?
6. **Offer, do not write.** If the conventions were not written down anywhere, offer a short summary the user can save in their project's rule file. Do not save it unasked.

## Rules

- Use the plain thing: a function before a class, the language or platform feature before a dependency, a direct call before indirection.
- Look before you write: search the project, then the language's standard library, for an existing function, component or helper that does the job, and use it. Write new code only when nothing fits.
- No abstraction until a second real use exists. Three similar lines are better than a helper made for one.
- Names say what a thing is; comments say why, not what.
- Keep control flow flat: early returns over deep nesting, one level of abstraction per function.
- No speculative options, flags, configuration or extension points. Do not handle errors that cannot happen.
- Never trade these for brevity (the never-trade list): validation of input at a trust boundary (user input, network, files, environment); error handling where a failure would lose or corrupt data; security checks; the accessibility basics of anything a person sees. Moved or merged code keeps its error handling.
- Smallest diff that does the job. Delete what your change makes unused before adding. No unrelated cleanup. Leave existing layers alone.
- Test at the seam the project already has; do not pull out a helper only to make code testable.
- Precedence: a written project rule beats these rules. Where there is no written rule, a habit of the project beats them on style, and these rules beat the habit on structure. The references count as these rules. Wrapping or swallowing errors, and adding structure only for tests, are structure. A direct request from the user beats all of these.

## References

Read only the entries that match the files you are about to touch. A framework entry assumes its language entry is read too. If a language or framework has no reference, use the language-agnostic rules above and say so in your report.

- `references/javascript.md`: a `.js`, `.mjs`, `.cjs` or `.jsx` file, or the nearest `package.json` above the files you touch.
- `references/typescript.md`: a `.ts` or `.tsx` file, or a `tsconfig.json`; read it with `javascript.md`.
- `references/react.md`: the nearest `package.json` above the files you touch lists `react`, or `.jsx` and `.tsx` files that import it.
- `references/vue.md`: the nearest `package.json` above the files you touch lists `vue`, or `.vue` files.
- `references/nextjs.md`: the nearest `package.json` above the files you touch lists `next`, or an `app/` or `pages/` directory with `next.config.*`.
- `references/nuxt.md`: the nearest `package.json` above the files you touch lists `nuxt`, or a `nuxt.config.*` file.
- `references/nodejs-express.md`: the nearest `package.json` above the files you touch lists `express`, or code that calls `express()`.
- `references/python.md`: a `.py` file, or a `pyproject.toml`, `requirements.txt` or `setup.py`.
- `references/django.md`: a `manage.py`, or `django` in the project's dependencies; read it with `python.md`.
- `references/fastapi.md`: `fastapi` in the project's dependencies, or code that creates a `FastAPI()` app; read it with `python.md`.
- `references/ruby.md`: a `.rb` file, a `Gemfile` or a `Rakefile`.
- `references/rails.md`: a `config/routes.rb` or `rails` in the `Gemfile`; read it with `ruby.md`.
- `references/php.md`: a `.php` file or a `composer.json`.
- `references/laravel.md`: an `artisan` file or `laravel/framework` in `composer.json`; read it with `php.md`.
- `references/go.md`: a `.go` file or a `go.mod`.
- `references/java.md`: a `.java` file, a `pom.xml` or a `build.gradle`.
- `references/kotlin.md`: a `.kt` or `.kts` file.
- `references/spring-boot.md`: `spring-boot` in `pom.xml`, `build.gradle` or `build.gradle.kts`, or a `@SpringBootApplication` class; read it with `java.md`, or with `kotlin.md` in a Kotlin project.
- `references/csharp.md`: a `.cs` file, a `.csproj` or a `.sln`.
- `references/aspnet-core.md`: a `.csproj` that uses `Microsoft.NET.Sdk.Web`, or a `Program.cs` that builds a web application; read it with `csharp.md`.
- `references/rust.md`: a `.rs` file or a `Cargo.toml`.
- `references/swift.md`: a `.swift` file or a `Package.swift`.
- `references/c-cpp.md`: a `.c`, `.h`, `.cc`, `.cpp` or `.hpp` file, a `CMakeLists.txt` or a `Makefile` for C code.
- `references/web-ui.md`: an `.html`, `.css`, `.scss`, `.vue` or `.svelte` file, or a component that returns markup; read it with the language reference.
- `references/sql.md`: a `.sql` file, a migration, or SQL text inside application code.
- `references/shell.md`: a `.sh` or `.bash` file, a shell shebang, or a command script in `package.json`, a `Makefile` or CI configuration.
