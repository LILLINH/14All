Status: draft, not measured.

# Web UI

## Simple here looks like

Pages built from the project's own components, tokens and spacing. Semantic HTML that works with a keyboard and a screen reader before any styling. One layout that adapts to the width, not a separate layout for each size. A new teammate finds every colour and size in one place.

## Do

- Use the project's design system first: its tokens, components, spacing and icons. A new look is for a project that has none.
- Read `javascript.md` and the framework reference for the markup and the logic. This file covers how the page looks and behaves.
- Check in this order, highest first: accessibility (text contrast of at least 4.5 to 1, everything reachable by keyboard, a label for every control, a visible focus), touch targets of about 44 pixels, layout at small widths, performance (give images a size so the page does not jump), typography, motion (respect the reduce-motion setting), forms (an error says what to fix, next to the field).
- Take colours, sizes and spacing from tokens, not typed values. Use text or the project's icon set for icons, not emoji.
- Check dark and light on their own when the project has both: contrast can pass in one and fail in the other.
- Render and look: open the page in a real browser at 375, 768 and 1440 pixels wide, take a screenshot of each, and judge the pictures, not the code. Fix the three worst problems and look again, at most three times, then report what is left.
- Check the production build as well as the development server: a minifier or a style optimizer can drop a rule that the development build had.
- When no browser is available, say so in your report: the page was not looked at. Do not write that it looks right.
- A quick critique: one second (is the main thing obvious?), squint (does the structure show?), cover the logo (is it still this product?), count the left edges (are there more than a few?), and look at the small screen as a page of its own, not a squeezed large one.

## Do not (what agents over-build here)

- A new colour, font or spacing value for one page. Instead: the nearest token.
- A component library or an icon package added for one control. Instead: the project's own components or plain HTML.
- Animation with no purpose, or one that ignores the reduce-motion setting. Instead: none, or a short one that shows a change of state.
- Fixed pixel widths and heights for layout. Instead: a flexible layout that adapts to the width.
- A style copied from a screenshot or another site over the project's own. Instead: the project's design.
- Saying the page looks right without having looked at it. Instead: look at it, or say that you did not.

## Check before finishing

- Does it work and read well at 375, 768 and 1440 pixels wide?
- Do colours, sizes and spacing come from the project's tokens?
- Can everything be reached and used with the keyboard, and does every control have a label?
- Does every image have a size and alternative text?
- Did I look at the page in a browser, or did I say that I could not?
