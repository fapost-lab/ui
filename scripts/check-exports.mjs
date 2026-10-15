#!/usr/bin/env node
/**
 * Holds the package's public surface together before it is packed:
 *
 *  1. every target of the `exports` map exists (a `*` pattern: every directory it matches has the file);
 *  2. every component directory and every module of src/lib/ is reachable through `exports`, so nothing in the
 *     package is importable only by a deep path;
 *  3. every subpath of surface.json resolves through `exports`;
 *  4. src/index.ts re-exports exactly the subpaths of surface.json, one per line, in the same order;
 *  5. no export target is a test file, and every target is shipped by `files`;
 *  6. the component table of README.md has a row for every subpath of surface.json.
 *
 * Exits non-zero with one line per problem. Run with `npm run check-exports`.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const surface = JSON.parse(readFileSync(join(root, 'surface.json'), 'utf8')).subpaths
const problems = []

/** The file a subpath (`components/button`, `styles.css`) resolves to through `exports`; `null` when none does. */
function resolveSubpath(subpath) {
    const key = `./${subpath}`

    if (typeof manifest.exports[key] === 'string') {
        return manifest.exports[key]
    }

    for (const [pattern, target] of Object.entries(manifest.exports)) {
        const star = pattern.indexOf('*')

        if (star === -1) {
            continue
        }

        const prefix = pattern.slice(0, star)
        const suffix = pattern.slice(star + 1)

        if (key.startsWith(prefix) && key.endsWith(suffix) && key.length > prefix.length + suffix.length) {
            const match = key.slice(prefix.length, key.length - suffix.length)

            // Like Node, a pattern match may not reach into a nested directory: no deep imports.
            if (!match.includes('/')) {
                return target.replace('*', match)
            }
        }
    }

    return null
}

/** Whether a package-relative path is shipped by the `files` list (directories and files, `!` excludes). */
function isShipped(path) {
    const clean = path.replace(/^\.\//, '')
    const included = manifest.files.filter((entry) => !entry.startsWith('!')).some((entry) => clean === entry || clean.startsWith(`${entry}/`))
    const excluded = clean.endsWith('.test.ts')

    return clean === 'package.json' || (included && !excluded)
}

// 1. Every target exists.
for (const [pattern, target] of Object.entries(manifest.exports)) {
    if (!pattern.includes('*')) {
        if (!existsSync(join(root, target))) {
            problems.push(`exports["${pattern}"] points at ${target}, which does not exist`)
        }

        continue
    }

    const base = target.slice(0, target.indexOf('*'))
    const directory = join(root, base)

    for (const name of readdirSync(directory).filter((entry) => statSync(join(directory, entry)).isDirectory())) {
        const file = target.replace('*', name)

        if (!existsSync(join(root, file))) {
            problems.push(`exports["${pattern}"] matches ${base}${name}, which has no ${relative(join(root, base, name), join(root, file))}`)
        }
    }
}

// 2. Nothing is reachable only by a deep path.
const targets = new Set(Object.entries(manifest.exports).filter(([pattern]) => !pattern.includes('*')).map(([, target]) => target))

for (const module of readdirSync(join(root, 'src/lib')).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))) {
    if (!targets.has(`./src/lib/${module}`)) {
        problems.push(`src/lib/${module} is not in exports, so it can only be reached by a deep path`)
    }
}

for (const component of readdirSync(join(root, 'src/components'))) {
    if (resolveSubpath(`components/${component}`) === null) {
        problems.push(`src/components/${component} is not reachable through exports`)
    }
}

// 3. The surface resolves.
for (const subpath of surface) {
    const target = resolveSubpath(subpath)

    if (target === null) {
        problems.push(`surface.json lists ${subpath}, which no key of exports resolves`)
    } else if (!existsSync(join(root, target))) {
        problems.push(`surface.json lists ${subpath}, which resolves to the missing ${target}`)
    }
}

// 4. The package entry re-exports the surface, line for line.
const entry = readFileSync(join(root, 'src/index.ts'), 'utf8')
const reExported = [...entry.matchAll(/^export \* from '@fapost\/ui\/(.+)'$/gm)].map((match) => match[1])

if (JSON.stringify(reExported) !== JSON.stringify(surface)) {
    problems.push(`src/index.ts re-exports [${reExported.join(', ')}], surface.json lists [${surface.join(', ')}]`)
}

// 5. Targets are shipped and are not tests.
for (const [pattern, target] of Object.entries(manifest.exports)) {
    if (target.endsWith('.test.ts')) {
        problems.push(`exports["${pattern}"] points at a test file`)
    }

    if (!isShipped(target.replace('*', 'x'))) {
        problems.push(`exports["${pattern}"] points at ${target}, which "files" does not ship`)
    }
}

// 6. The README documents the surface.
const readme = readFileSync(join(root, 'README.md'), 'utf8')

for (const subpath of surface) {
    if (!readme.includes(`| \`${subpath}\` |`)) {
        problems.push(`README.md has no row for ${subpath} in its component table`)
    }
}

if (problems.length > 0) {
    console.error(`check-exports: ${problems.length} problem(s)\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
    process.exit(1)
}

console.log(`check-exports: ${Object.keys(manifest.exports).length} export keys, ${surface.length} surface subpaths, all consistent`)
