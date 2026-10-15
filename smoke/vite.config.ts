import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

/**
 * The configuration the README asks a consumer for: the kit is source (`.vue` + `.ts`), so it is kept out of
 * dependency pre-bundling, and the peers that hold module state resolve to one copy.
 */
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    optimizeDeps: {
        exclude: ['@fapost/ui'],
    },
    resolve: {
        dedupe: ['vue', '@inertiajs/vue3', 'reka-ui', 'vue-sonner'],
    },
    build: {
        // One CSS file to assert on; the whole surface in one chunk is expected here.
        cssCodeSplit: false,
        chunkSizeWarningLimit: 1024,
    },
})
