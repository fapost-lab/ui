# @fapost/ui

[![npm](https://img.shields.io/npm/v/@fapost/ui?label=npm)](https://www.npmjs.com/package/@fapost/ui)
[![CI](https://github.com/fapost-lab/ui/actions/workflows/ci.yml/badge.svg)](https://github.com/fapost-lab/ui/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

The component kit of the [FaPost](https://docs.fapost.in) console: the **Warm Minimal** design tokens, a
**Tailwind CSS 4** theme over them, and **Vue 3** components built on [shadcn-vue](https://www.shadcn-vue.com) and
[reka-ui](https://reka-ui.com), including a server-driven `DataTable` for Inertia list screens.

It is what [FaPost Core](https://github.com/fapost-lab/core) renders its console with, and what a FaPost Solution
builds its console screens against: at run time Core puts this kit in the import map of every Solution bundle, so the
console and every Solution share one copy of each component.

The package ships **source** — `.vue` and `.ts` as ES modules, plus CSS — for applications built with Vite and
`@vitejs/plugin-vue`. There is no `dist/`; your build compiles the kit with your own code.

## Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Theming and tokens](#theming-and-tokens)
- [Components](#components)
- [For Solution authors](#for-solution-authors)
- [What is not here: the shell](#what-is-not-here-the-shell)
- [Versioning](#versioning)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install @fapost/ui vue @inertiajs/vue3 reka-ui vue-sonner tailwindcss
```

The last five are **peer dependencies**: each must exist once on a page, so your application owns them.

| Peer | Range | Why it is a peer |
|---|---|---|
| `vue` | `^3.5` | one Vue instance per page |
| `@inertiajs/vue3` | `^3` | `DataTable` visits through your application's Inertia router |
| `reka-ui` | `^2.11` | its components talk through provide/inject contexts |
| `vue-sonner` | `^2` | toasts live in module state, shared by `Toaster` and `toast` |
| `tailwindcss` | `^4` | your Tailwind compiles the kit's CSS; there is one Tailwind per page |

Everything else the kit needs (`@vueuse/core`, `@lucide/vue`, `class-variance-authority`, `clsx`, `tailwind-merge` and
the three Fontsource typefaces) comes with it as ordinary dependencies.

**Requirements:** Vite with `@vitejs/plugin-vue`, Tailwind CSS 4 (`@tailwindcss/vite`), and TypeScript in `strict`
mode if you type-check: `vue-tsc` checks the kit's source together with yours.

## Setup

### Vite

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    // The kit is .vue source: dependency pre-bundling cannot compile it.
    optimizeDeps: {exclude: ['@fapost/ui']},
    // The peers that hold state resolve to one copy, also when the kit is linked from a checkout.
    resolve: {dedupe: ['vue', '@inertiajs/vue3', 'reka-ui', 'vue-sonner']},
})
```

### Vitest

Vitest externalises `node_modules` by default, and Node cannot load a `.vue` file. Let Vite transform the kit:

```ts
// vitest.config.ts
export default defineConfig({
    plugins: [vue()],
    resolve: {dedupe: ['vue', '@inertiajs/vue3', 'reka-ui', 'vue-sonner']},
    test: {server: {deps: {inline: ['@fapost/ui']}}},
})
```

### CSS

Import Tailwind first, then the kit:

```css
/* resources/css/app.css */
@import 'tailwindcss';
@import '@fapost/ui/styles.css';
```

`styles.css` brings the fonts, the tokens, the theme, the base layer (borders, page background and text colour) and an
`@source` pointing at the kit's components. That `@source` is resolved relative to the installed package, so your
Tailwind generates the kit's classes from inside `node_modules` without any configuration of yours.

### Strings

The kit has no locale of its own. Its few built-in strings — the close button of dialogs and sheets, and the
`DataTable` labels — default to English. A host application provides its own once, at the root, and every string it
leaves out keeps the English default:

```ts
import {KIT_MESSAGES} from '@fapost/ui/lib/messages'

app.provide(KIT_MESSAGES, () => ({
    close: t('Close'),
    table: {search: t('Search'), empty: t('Nothing here yet.')},
}))
```

The provider is a function and is read on every render, so a locale switch shows at once. The full shape is the
`KitMessages` type; placeholders are `:name`, filled with `interpolate` from `@fapost/ui/lib/utils`.

## Usage

Import from a component's subpath. Each subpath is an `index.ts`; nothing deeper is exported.

```vue
<script setup lang="ts">
import {useForm} from '@inertiajs/vue3'
import {Button} from '@fapost/ui/components/button'
import {FormField} from '@fapost/ui/components/form-field'
import {FormSection} from '@fapost/ui/components/form-section'
import {Input} from '@fapost/ui/components/input'

const form = useForm({name: ''})
</script>

<template>
  <form @submit.prevent="form.post('/groups')">
    <FormSection title="Group" description="How the group appears in lists and filters.">
      <FormField id="name" label="Name" :error="form.errors.name" v-slot="{invalid, describedBy}">
        <Input id="name" v-model="form.name" :aria-invalid="invalid" :aria-describedby="describedBy" />
      </FormField>
    </FormSection>

    <Button type="submit" :disabled="form.processing">Save</Button>
  </form>
</template>
```

`DataTable` is server-driven: search, sort, page size and page live in the query string, every change is an Inertia
visit to `url`, and the rows, `meta`, `state` and `defaults` come back from the server as page props.

```vue
<script setup lang="ts">
import {DataTable, type DataTableColumn, type TableDefaults, type TableMeta, type TableState} from '@fapost/ui/components/data-table'
import {StatusDot} from '@fapost/ui/components/badge'

defineProps<{
  rows: {id: string; name: string; status: 'active' | 'blocked'}[]
  meta: TableMeta
  state: TableState
  defaults: TableDefaults & {perPageOptions: readonly number[]}
}>()

const columns: DataTableColumn[] = [
  {key: 'name', label: 'Name', sortable: true},
  {key: 'status', label: 'Status'},
]
</script>

<template>
  <DataTable :columns :rows :meta :state :defaults url="/contacts" selectable>
    <template #cell-status="{row}">
      <StatusDot :tone="row.status === 'active' ? 'success' : 'danger'">{{ row.status }}</StatusDot>
    </template>
  </DataTable>
</template>
```

Its slots (`cell-<key>`, `actions`, `toolbar`, `bulk-actions`, `empty`) and grouping are described in the component's
doc comment.

Toasts: render `<Toaster />` once and call `toast` **from the kit**, not from `vue-sonner`, so the caller and the
toaster always share one module:

```ts
import {toast} from '@fapost/ui/components/sonner'

toast.success('Saved')
```

The package root, `@fapost/ui`, re-exports every subpath of [`surface.json`](surface.json) in one module, for tools
that want a single entry. Import by subpath in application code.

## Theming and tokens

The kit's look is a set of CSS custom properties in [`tokens.css`](src/styles/tokens.css): one block on `:root` for the
light theme and one on `.dark`. [`theme.css`](src/styles/theme.css) maps them onto Tailwind utilities, so
`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`, `shadow-md` and `font-display` all read the
tokens.

| Group | Tokens |
|---|---|
| Surfaces | `background`, `foreground`, `card`, `popover`, `muted`, `surface-muted`, `scrim` (each with its `-foreground` where text sits on it) |
| Actions | `primary`, `primary-hover`, `primary-soft`, `primary-soft-border`, `secondary`, `accent`, `destructive` |
| Lines and focus | `border`, `border-soft`, `input`, `ring`, `invalid`, `danger-border` |
| Text | `faint-foreground`, `subtle-foreground` (decorative only) |
| Statuses | `success`, `info`, `warning`, `danger`, `neutral` with `-foreground`, and a `-dot` colour each |
| Navigation | `sidebar-*`, `rail`, `rail-border`, `rail-dashed` |
| Tables | `row-selected` |
| Toasts | `toast`, `toast-foreground`, `toast-muted-foreground`, `toast-border` |
| Charts | `chart-1` … `chart-5` |
| Shape and type | `radius`, `shadow-ink`, `font-sans`, `font-display`, `font-mono` |

**Dark mode** is the `.dark` class on an ancestor, usually `<html>`; the theme's `dark:` variant follows the same
class. Switching and remembering the theme is the host application's job.

**Adding a token:** declare it on `:root` *and* on `.dark` in `tokens.css` (only `--radius` and the font tokens are
theme-independent — a test holds the two blocks to the same names), then map it in `theme.css` as
`--color-<name>: var(--<name>)` to get its utilities. A new token is an addition, released as a patch (see
[Versioning](#versioning)).

**Fonts:** Onest (text, `font-sans`), Roboto Condensed (headings, `font-display`) and Victor Mono (code, `font-mono`),
as variable fonts from Fontsource.

**The CSS exports**, for hosts that need less than the whole kit:

| Export | Contents | For |
|---|---|---|
| `@fapost/ui/styles.css` | fonts, tokens, theme, `@source` on the components, base layer | a host application, after `@import 'tailwindcss'` |
| `@fapost/ui/theme.css` | the `dark` variant and `@theme inline` over the tokens; no preflight, no base | utilities on the tokens without the kit's base styles |
| `@fapost/ui/tokens.css` | the custom properties on `:root` and `.dark` only | a page styled without Tailwind that should still match |
| `@fapost/ui/fonts.css` | the three Fontsource imports | the same |

## Components

| Subpath | What it is for |
|---|---|
| `components/alert-dialog` | A modal that interrupts for a decision; the parts of reka-ui's AlertDialog |
| `components/avatar` | A user's picture with initials as the fallback |
| `components/badge` | `Badge` for a short label, `StatusDot` for a status in a table cell |
| `components/button` | Buttons in the kit's variants (`default`, `destructive`, `outline`, `outline-danger`, `secondary`, `ghost`, `link`) and sizes |
| `components/card` | A framed section with header, title, description, action, content and footer |
| `components/checkbox` | A checkbox |
| `components/command` | A filterable command list and its dialog, for ⌘K-style search |
| `components/confirm-dialog` | Asks before something that cannot be undone; `v-model:open` and a `confirm` event |
| `components/data-table` | The server-driven list table, its pagination, `ValueCell` and the query helpers |
| `components/dialog` | A modal dialog, with a scrollable variant |
| `components/dropdown-menu` | A menu on a trigger, with checkbox, radio and sub-menus |
| `components/empty-state` | What a list or section shows when it has nothing yet, with the action that fills it |
| `components/form-field` | A control with its label, hint and server-side error, wired for screen readers |
| `components/form-section` | A group of related fields on a card: what it is for on the left, the fields on the right |
| `components/input` | A text input |
| `components/label` | A form label |
| `components/localized-field` | A text in each language, one tab per language, with per-language errors |
| `components/options-picker` | Chooses some of a fixed list; the choices show as chips |
| `components/select` | A single-choice select |
| `components/separator` | A horizontal or vertical rule |
| `components/sheet` | A panel that slides in from an edge |
| `components/skeleton` | A placeholder while content loads |
| `components/sonner` | The `Toaster` and the `toast` function |
| `components/switch` | An on/off switch |
| `components/table` | The plain table parts the `DataTable` is made of, for tables that are not server-driven |
| `components/tabs` | Tabs and their panels |
| `components/textarea` | A multi-line text input |
| `components/tooltip` | A tooltip and its provider |
| `components/value-list-input` | A list of free-text values as chips: Enter or a comma adds one |
| `lib/utils` | `cn` (merges Tailwind classes) and `interpolate` (fills `:name` placeholders) |
| `lib/relative-time` | `relativeTime` — "3 minutes ago" in a given locale |

Besides these, `lib/messages` is the host's API for the kit's strings (see [Strings](#strings)). Components take
every other label through their props: none carries text of its own.

## For Solution authors

A FaPost Solution's console UI is a **prebuilt** bundle that runs on the console's own Vue, Inertia and kit. Build it
against this package, and keep `vue`, `@inertiajs/vue3`, `@fapost/ui` and every subpath of
[`surface.json`](surface.json) **external**: Core's import map points all of them at the copy the console runs, so
there is one kit on the page. Declare the kit range you built against in `fapost-ui.json` (`"kit": "^0.1"`).

- Use only the subpaths in `surface.json`; they are the promise to Solutions. `lib/messages` and the CSS exports are
  for the host application, not for a Solution bundle.
- Do not ship global CSS or override the kit's classes. For utilities on the kit's tokens in your own components,
  import `@fapost/ui/theme.css` into your build's Tailwind — it has no preflight and no base styles — and prefix
  classes of your own.
- Show toasts with the kit's `toast`; only the console's copy is connected to the toaster on the page.

The whole contract — declarations, `fapost-ui.json`, names and the import map — is in
[Console UI](https://docs.fapost.in/extending/console-ui) on docs.fapost.in.

## What is not here: the shell

The console's shell — the application rail, side menu, top bar, theme switch, live updates and the slots Solutions
fill — is **part of FaPost Core**, not of this package. It is bound to the page props Core's server shares and changes
together with them, so it lives in [fapost-lab/core](https://github.com/fapost-lab/core) (`resources/js/console`).
A Solution never imports the shell; it adds to it through the declarations in Core's documentation.

## Versioning

The package follows [Semantic Versioning](https://semver.org/). While the major version is `0`:

- **`0.MINOR.0` breaks** something on the public surface;
- **`0.x.PATCH` adds or fixes** without breaking.

So a range like `^0.1.0` (`>=0.1.0 <0.2.0` for npm and Composer alike) receives new components and fixes, and stops
only at a real break.

| Breaking | Not breaking |
|---|---|
| a subpath, export or token removed or renamed | a new component, subpath, prop, slot or token |
| a prop, event or slot removed or its meaning changed | a visual change that follows the approved designs |
| a new major of a peer dependency | a change in the Tailwind classes inside a component |

Everything reachable through `exports` in `package.json` is public; the package has no internal API. Every change is in
the [CHANGELOG](CHANGELOG.md). `1.0.0` comes once a Solution has lived on the kit.

## Development

The kit is developed next to FaPost Core, which is its first consumer:

```bash
# inside a checkout of fapost-lab/core
git clone git@github.com:fapost-lab/ui.git packages/fapost-ui
npm run dev:link   # once Core consumes the package: links node_modules/@fapost/ui to packages/fapost-ui
```

`packages/` is ignored by Core's git. With the link in place, an edit in the kit shows in Core's Vite dev server at
once; `npm install` in Core restores the link by itself (`postinstall`).

In the package itself (Node 26, as in CI):

```bash
npm ci
npm run type-check     # vue-tsc --noEmit
npm test               # vitest run
npm run check-exports  # the exports map, surface.json and src/index.ts agree
npm run smoke          # npm pack, install into smoke/, vite build, assert the kit's classes are in the CSS
```

Inside the package the kit imports itself as `@fapost/ui/...`, as a consumer does; `tsconfig.json` and
`vitest.config.ts` point that specifier at `src/`. The kit's boundary (what it may import) and the public surface are
held by tests in `src/`.

**Adding a component with the shadcn-vue CLI:** `components.json` is set up for this repository, so
`npx shadcn-vue@latest add <component>` writes into `src/components/`. Then:

1. turn the component's labels into props (or `lib/messages` for the kit's own strings) and keep it free of `<style>`;
2. move any CSS variables the CLI added to `src/styles/styles.css` into `tokens.css` — on `:root` **and** `.dark` —
   and their `--color-*` mappings into `theme.css`;
3. add its subpath to `surface.json`, `src/index.ts` and the table above if Solutions may use it.

**Releasing:** bump `version` in `package.json` and turn `## Unreleased` in the CHANGELOG into `## <version>` in a
pull request; once it is merged, a maintainer pushes the tag `v<version>` on `main`. The release workflow checks the
tag against `package.json`, runs CI, publishes to npm with provenance, and creates the GitHub Release from the
CHANGELOG section.

Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0 — see [LICENSE](LICENSE). Contributions are accepted under the FaPost
[Contributor License Agreement](https://github.com/fapost-lab/core/blob/main/CLA.md). "FaPost" and its logo are
trademarks; see the [trademark policy](https://github.com/fapost-lab/core/blob/main/TRADEMARK.md).
