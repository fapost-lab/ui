# Changelog

Notable changes to `@fapost/ui`. Versions follow [Semantic Versioning](https://semver.org/). While the major version
is `0`, a minor release (`0.MINOR.0`) is the one that may break the public surface — a subpath, export, token, prop,
event or slot removed or changed in meaning, or a new major of a peer dependency — and says so here with
**BREAKING:**; a patch release (`0.x.PATCH`) only adds and fixes. So `^0.1.0` takes every addition and stops at a real
break. Everything reachable through `exports` in `package.json` is public.

## Unreleased

## 0.1.0

The kit leaves FaPost Core and becomes a package of its own. Its history comes along: the commits before this release
are the kit's commits in [fapost-lab/core](https://github.com/fapost-lab/core) (`resources/js/ui`).

### Added

- 29 components, each at its own subpath `@fapost/ui/components/<name>`: `alert-dialog`, `avatar`, `badge`, `button`,
  `card`, `checkbox`, `command`, `confirm-dialog`, `data-table`, `dialog`, `dropdown-menu`, `empty-state`,
  `form-field`, `form-section`, `input`, `label`, `localized-field`, `options-picker`, `select`, `separator`, `sheet`,
  `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`, `value-list-input`.
- `@fapost/ui/lib/utils` (`cn`, `interpolate`) and `@fapost/ui/lib/relative-time` (`relativeTime`).
- `@fapost/ui/lib/messages`: `KIT_MESSAGES`, `useKitMessages()` and the `KitMessages` type — the host application
  provides the kit's strings (dialog close, `DataTable` labels); English defaults otherwise.
- CSS: `@fapost/ui/styles.css` (everything, with `@source` on the components), `theme.css` (the Tailwind 4 theme over
  the tokens, without preflight), `tokens.css` (Warm Minimal custom properties on `:root` and `.dark`) and
  `fonts.css` (Onest, Roboto Condensed, Victor Mono).
- `@fapost/ui/surface.json`: the subpaths a FaPost Solution may import, which Core puts in a Solution's import map;
  the package root `@fapost/ui` re-exports exactly these.
- Shipped as source (`.vue`, `.ts`, `.css`) for Vite with `@vitejs/plugin-vue` and Tailwind CSS 4; `vue`,
  `@inertiajs/vue3`, `reka-ui`, `vue-sonner` and `tailwindcss` are peer dependencies.
