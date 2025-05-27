// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'


export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true, // Vider le dossier dist avant chaque build
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src/background/background.ts'),
                content: resolve(__dirname, 'src/content/content.tsx'),
                injected: resolve(__dirname, 'src/injected/injected.tsx'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        },
        target: 'es2020',
        minify: false
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    },
    esbuild: {
        target: 'es2020'
    }
})

