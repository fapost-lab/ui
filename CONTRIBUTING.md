# Contributing to @fapost/ui

The kit follows the process of [FaPost Core](https://github.com/fapost-lab/core); the full guide is
[Contributing](https://docs.fapost.in/contributing/overview) on docs.fapost.in. The short version:

## Branches and pull requests

- `main` is the only long-lived branch and is releasable at every commit. Work on short-lived branches
  (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`) and reach `main` through a squash-merged pull request.
- Titles and commits use [Conventional Commits](https://docs.fapost.in/contributing/commits):
  `feat(data-table): …`, `fix(dialog): …`.
- Before opening a pull request, run what CI runs:

  ```bash
  npm run type-check && npm test && npm run check-exports && npm run smoke
  ```

- A change a consumer can see gets a line under `## Unreleased` in [CHANGELOG.md](CHANGELOG.md), in Added, Changed or
  Fixed; a breaking one starts with `**BREAKING:**` and goes into the next minor (see [Versioning](README.md#versioning)).
- A first pull request accepts the FaPost [Contributor License Agreement](https://github.com/fapost-lab/core/blob/main/CLA.md)
  with the comment the CLA check asks for. You keep the copyright in what you contribute.

## Rules of the kit

- The kit imports only itself (through public subpaths or relative paths), `vue`, the router of `@inertiajs/vue3`,
  `reka-ui`, `vue-sonner`, `@vueuse/core`, `@lucide/vue`, `class-variance-authority`, `clsx` and `tailwind-merge`.
  It knows no host application: no page props, no translations — labels come through props or `lib/messages`.
  `src/boundary.test.ts` holds this.
- Components have no `<style>` blocks; CSS lives in `src/styles/`. `tokens.css` holds custom properties only, and
  every themed property on `:root` is also on `.dark` (`src/styles/tokens.test.ts`).
- A module is public only through a key of `exports` in `package.json`; there are no deep imports. A subpath a
  Solution may use is listed in `surface.json`, re-exported by `src/index.ts` and described in the README's component
  table (`scripts/check-exports.mjs`, `src/surface.test.ts`).

## The shadcn-vue CLI

`components.json` points the CLI at this repository: `npx shadcn-vue@latest add <component>` writes into
`src/components/` and imports through `@fapost/ui/...`. The CLI writes the CSS variables a component needs into
`src/styles/styles.css`, which is not where they belong. Move them:

- the values to `src/styles/tokens.css`, on `:root` **and** `.dark`;
- their `--color-*` mappings to the `@theme inline` block of `src/styles/theme.css`.

Then take the component's hard-coded labels into props and drop any `<style>` block.

## Releases

A release is a tag `v<version>` on `main` that equals `version` in `package.json`; the version bump and its CHANGELOG
section land in a pull request first. Pushing the tag runs `.github/workflows/release.yml`, which checks, publishes to
npm with provenance and creates the GitHub Release. Only maintainers push tags.
