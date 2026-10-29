Status: draft, not measured.

# React

## Simple here looks like

Function components that take props and return JSX. State lives in the lowest component that needs it. Values that can be worked out from props or state are worked out while rendering. Effects are only for talking to something outside React. A new teammate follows a component without opening a second file.

## Do

- Read `javascript.md` first, and `typescript.md` when the project uses TypeScript.
- Keep state in the component that uses it. Lift it up only when two components that are not parent and child need the same value.
- Compute derived values during render instead of storing them in state.
- Use the project's existing hooks, context and data layer when they already do what you need.
- Give a repeated list item a stable `key` from the data, not from the index when items can move.
- Write event handlers inline for one line, as a named function for more.
- Split a component when a part has a name worth giving, not before.

## Do not (what agents over-build here)

- A custom hook for one use. Instead: write the logic in the component; extract on the second real use.
- Context for state that only a parent and a child share. Instead: props, or `children`.
- A state library or reducer for local state or two fields. Instead: `useState`.
- A wrapper component with no behaviour of its own, that only passes props along. Instead: use the inner component directly.
- `useMemo`, `useCallback` and `memo` with no measured problem. Instead: plain code.
- `useEffect` to compute a value from other values, or to copy state into other state. Instead: compute it while rendering.
- Higher-order components and render-prop wrappers in new code. Instead: a component and a hook if needed.

## Check before finishing

- Is every piece of state needed, or can it be derived from props or other state?
- Did I add a hook, context or wrapper component that has only one user?
- Would removing each `useMemo`, `useCallback` and `useEffect` I added change behaviour?
- Does the new component read like its neighbours in naming and layout?
