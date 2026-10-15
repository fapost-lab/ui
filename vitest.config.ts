import {defineConfig} from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Unit tests of the kit, in Node by default. A test that mounts components opts into a DOM with
 * `// @vitest-environment happy-dom` and mounts through `@vue/test-utils`.
 *
 * The kit refers to itself as `@fapost/ui/...`, exactly as a consumer does (and as the shadcn CLI writes it); here
 * that specifier points at src/, in a consumer it is a bare import resolved through the `exports` map.
 */
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: [
            {find: /^@fapost\/ui$/, replacement: path.resolve(root, 'src/index.ts')},
            {find: /^@fapost\/ui\/(.*)$/, replacement: path.resolve(root, 'src/$1')},
        ],
    },
    test: {
        include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
        environment: 'node',
    },
})
