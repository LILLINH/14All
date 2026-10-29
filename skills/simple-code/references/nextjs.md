Status: draft, not measured.

# Next.js

## Simple here looks like

Server components by default, with data fetched where it is shown. A client component only where the user interacts. Route handlers only for callers that are not your own pages. Follow the project's router (the `app` directory or `pages`) and do not mix the two styles. Read `javascript.md` first, and `typescript.md` when the project uses TypeScript.

## Do

- Fetch data in the server component that shows it, with `fetch` or the project's existing data function.
- Put `'use client'` on the smallest component that needs state, effects or browser APIs, not on a whole page.
- Use the built-ins: `Link`, `Image`, `notFound`, `redirect`, metadata exports.
- Use server actions or route handlers the way the project already does for mutations.
- Keep page-level code in the page and share only what a second page needs.

## Do not (what agents over-build here)

- A client component for markup that needs no interactivity. Instead: a server component.
- A route handler or server action for what a server component can read directly. Instead: read it in the component.
- A client-side data library layered over data the server already fetched, when the project has none. Instead: pass the data down as props.
- Middleware for the rules of one route. Instead: a check in that route.
- Global state for data that belongs to one page. Instead: props, or the URL when the state is a filter or a page number.

## Check before finishing

- Does this need to run on the client, or can it be a server component?
- Did I add a route handler, action or middleware that a direct read would replace?
- Is `'use client'` on the smallest component possible?
- Did I stay in the project's router style?
