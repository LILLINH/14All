# slugify

`slugify(text)` is the default-named export `slugify` of `src/slugify.mjs`. It turns a title into a URL slug.

Rules:

- Lowercase the text.
- Replace every run of characters that are not a letter or digit (a to z, 0 to 9) with a single hyphen.
- Remove a leading or trailing hyphen.
- Text with no letters or digits gives an empty string.

Examples:

| Input | Output |
|---|---|
| `Hello, World!` | `hello-world` |
| `  Many   spaces  ` | `many-spaces` |
| `already-a-slug` | `already-a-slug` |
| `!!!` | `` |
