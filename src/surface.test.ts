/// <reference types="node" />
import {existsSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'
import {describe, expect, it} from 'vitest'

/**
 * The surface a Solution's bundle may import (surface.json): every subpath is a module of the kit, the package entry
 * re-exports exactly these, and no name is exported by two of them. FaPost Core maps all of them to one module in a
 * Solution's import map, where `export *` would silently drop a name two subpaths share.
 */
const srcRoot = dirname(fileURLToPath(import.meta.url))
const subpaths = (JSON.parse(readFileSync(resolve(srcRoot, '../surface.json'), 'utf8')) as {subpaths: string[]}).subpaths

/** The file a public subpath resolves to: a component's index or a module of lib/. */
function sourceOf(subpath: string): string {
    const asDirectory = resolve(srcRoot, subpath, 'index.ts')

    return existsSync(asDirectory) ? asDirectory : resolve(srcRoot, `${subpath}.ts`)
}

function hasExportModifier(node: ts.Node): boolean {
    return ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
}

function bindingNames(name: ts.BindingName): string[] {
    if (ts.isIdentifier(name)) {
        return [name.text]
    }

    return name.elements.flatMap((element) => (ts.isOmittedExpression(element) ? [] : bindingNames(element.name)))
}

/**
 * Every name a module exports, read from its syntax: value and type names alike, since both collide under `export *`.
 * A bare `export * from` is reported as `*`: its names cannot be checked from here, so the surface must not use one.
 */
function exportedNames(file: string): string[] {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
    const names: string[] = []

    for (const statement of source.statements) {
        if (ts.isExportDeclaration(statement)) {
            if (statement.exportClause === undefined) {
                names.push('*')
            } else if (ts.isNamedExports(statement.exportClause)) {
                names.push(...statement.exportClause.elements.map((element) => element.name.text))
            } else {
                names.push(statement.exportClause.name.text)
            }
        } else if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
            names.push(...statement.declarationList.declarations.flatMap((declaration) => bindingNames(declaration.name)))
        } else if (
            (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)
                || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement))
            && hasExportModifier(statement)
            && statement.name !== undefined
        ) {
            names.push(statement.name.text)
        }
    }

    return names
}

describe('the public surface of @fapost/ui', () => {
    it('is re-exported by the package entry one subpath per line, in the listed order', () => {
        const reExports = [...readFileSync(resolve(srcRoot, 'index.ts'), 'utf8').matchAll(/^export \* from '@fapost\/ui\/(.+)'$/gm)]
            .map((match) => match[1])

        expect(reExports).toEqual(subpaths)
    })

    it('lists only modules of the kit that exist', () => {
        for (const subpath of subpaths) {
            expect(existsSync(sourceOf(subpath)), subpath).toBe(true)
        }
    })

    it('exports every name from exactly one subpath', () => {
        const owners = new Map<string, string[]>()

        for (const subpath of subpaths) {
            const names = exportedNames(sourceOf(subpath))

            expect(names, `${subpath} uses a bare export *`).not.toContain('*')
            expect(names.length, `${subpath} exports nothing`).toBeGreaterThan(0)

            for (const name of names) {
                owners.set(name, [...(owners.get(name) ?? []), subpath])
            }
        }

        const shared = [...owners].filter(([, where]) => where.length > 1)

        expect(shared).toEqual([])
    })
})
