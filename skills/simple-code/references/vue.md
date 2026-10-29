Status: draft, not measured.

# Vue

## Simple here looks like

Single-file components that use the API the project already uses (usually `<script setup>`). Props go down and events come up. Local state is a `ref`; a value worked out from other values is a `computed`. The template reads like the page it produces.

## Do

- Read `javascript.md` first, and `typescript.md` when the project uses TypeScript.
- Use the same API as the surrounding components (Composition or Options). Do not mix them in one component.
- Use `computed` for anything worked out from other state. Use a watcher only for a side effect.
- Pass data down with props and report back with emits. Use `v-model` for form fields.
- Keep local state in a `ref` in the component that uses it. Use the project's store only for state that several distant components share.
- Split a component when a part has a name worth giving, not before.

## Do not (what agents over-build here)

- A composable for one use. Instead: write the logic in the component; extract on the second real use.
- A Pinia store, or any state library, for state one component or one parent and child use. Instead: a `ref` and props.
- `provide` and `inject` where props work. Instead: props.
- A wrapper component with no behaviour of its own, that only passes props and slots along. Instead: use the inner component directly.
- A watcher that sets a value which a `computed` could return. Instead: `computed`.
- Mixins, an event bus, or a second reactivity style added next to the project's own. Instead: props, emits and the project's existing pattern.

## Check before finishing

- Is every `ref` needed, or can it be a `computed` from another one?
- Did I add a composable, store or wrapper component that has only one user?
- Could I replace each watcher I wrote with a `computed` or an emit?
- Does the new component use the same API and layout as its neighbours?
