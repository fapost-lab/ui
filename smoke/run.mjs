#!/usr/bin/env node
/**
 * Installs the package the way a consumer gets it and builds an application on it:
 *
 *  1. `npm pack` the package (only what `files` ships);
 *  2. install the tarball into smoke/ next to Vite, Tailwind 4 and @vitejs/plugin-vue;
 *  3. import the package entry, `lib/messages` and every subpath of surface.json, and `@fapost/ui/styles.css`;
 *  4. `vite build`, then assert that the CSS holds classes that only the kit's components use.
 *
 * Step 4 catches "Tailwind does not see node_modules": the application has no classes of its own, so every utility in
 * the output was found through the `@source` of styles.css inside the installed package.
 */
import {execFileSync} from 'node:child_process'
import {mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const smoke = dirname(fileURLToPath(import.meta.url))
const root = resolve(smoke, '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function run(command, args, cwd) {
    console.log(`smoke: ${command} ${args.join(' ')}`)
    execFileSync(command, args, {cwd, stdio: 'inherit'})
}

// 1. Pack.
const pack = join(smoke, '.pack')
rmSync(pack, {recursive: true, force: true})
mkdirSync(pack)
run(npm, ['pack', '--pack-destination', pack], root)
const tarball = join(pack, readdirSync(pack).find((name) => name.endsWith('.tgz')))

// 2. Install, as a consumer does: the application's own dependencies and the tarball.
rmSync(join(smoke, 'node_modules', '@fapost'), {recursive: true, force: true})
run(npm, ['install', '--no-save', '--no-audit', '--no-fund', tarball], smoke)

// 3. One namespace import per subpath of the surface the installed package declares.
const surface = JSON.parse(readFileSync(join(smoke, 'node_modules/@fapost/ui/surface.json'), 'utf8')).subpaths
writeFileSync(
    join(smoke, 'src/surface.generated.ts'),
    [
        ...surface.map((subpath, index) => `import * as m${index} from '@fapost/ui/${subpath}'`),
        '',
        'export const surface = {',
        ...surface.map((subpath, index) => `    '${subpath}': m${index},`),
        '}',
        '',
    ].join('\n'),
)

// 4. Build and look at the CSS.
rmSync(join(smoke, 'dist'), {recursive: true, force: true})
run(npx, ['vite', 'build'], smoke)

const assets = join(smoke, 'dist/assets')
const css = readdirSync(assets).filter((name) => name.endsWith('.css')).map((name) => readFileSync(join(assets, name), 'utf8')).join('\n')

const expectations = [
    ['a utility over a kit token, used by Button', /\.bg-primary\b/],
    ['a reka-ui state variant, used by Dialog, Sheet and Select', /\.data-\\\[state\\=open\\\]\\:/],
    ['a utility over a muted-text token', /\.text-muted-foreground\b/],
    ['the light tokens', /--primary:\s*#5a6e58/],
    ['the dark tokens', /\.dark\s*\{[^}]*--primary:\s*#8fa68c/],
    ['the kit typeface', /@font-face\s*\{[^}]*Onest Variable/],
    ['the base layer of styles.css', /--color-background|background-color:\s*var\(--color-background\)/],
]

const missing = expectations.filter(([, pattern]) => !pattern.test(css))

if (missing.length > 0) {
    console.error(`smoke: the built CSS (${css.length} bytes) lacks:\n${missing.map(([what]) => `  - ${what}`).join('\n')}`)
    process.exit(1)
}

console.log(`smoke: ${surface.length} surface subpaths built; the CSS (${css.length} bytes) holds the kit's classes, tokens and fonts`)
