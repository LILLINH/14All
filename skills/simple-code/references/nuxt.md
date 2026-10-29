Status: draft, not measured.

# Nuxt

## Simple here looks like

Pages in `pages/`, data loaded in the page with `useFetch` or `useAsyncData`, small shared state in `useState`, and the framework's auto-imports used as the project already uses them. Server code lives in `server/` only when the work must run on the server. Read `javascript.md` first, and `typescript.md` when the project uses TypeScript.

## Do

- Load a page's data in the page with `useFetch` or `useAsyncData`.
- Use `useState` for small state shared between components, before reaching for a store.
- Follow the project's habit on auto-imports: import explicitly only if the project does.
- Put logic in a composable only when two places use it.
- Use the built-ins first: `NuxtLink`, `definePageMeta`, layouts, `navigateTo`.

## Do not (what agents over-build here)

- A plugin or module for one use. Instead: code in the component, or one composable on the second use.
- A composable that wraps `useFetch` and changes nothing. Instead: call `useFetch` where it is needed.
- A Pinia store where `useState` or a `ref` is enough. Instead: `useState` or a `ref`.
- A server route that returns data a page could load directly. Instead: load it in the page, unless the work needs server secrets.
- A layer of services between a page and its data call. Instead: the call in the page.

## Check before finishing

- Does this data load in the page, or did I add a layer in between?
- Did I add a plugin, module, store or composable with only one user?
- Does a server route here have a reason a page call lacks, such as a secret?
- Did I follow the project's auto-import habit?
