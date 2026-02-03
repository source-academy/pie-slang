import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'force-solver-swap',
      enforce: 'pre',
      resolveId(source, _importer) {
        // Optimization: Catch early
        if (source.includes('todo-solver') && !source.includes('browser')) {
          return path.resolve(__dirname, '../src/pie-interpreter/solver/todo-solver.browser.ts');
        }
      },
      load(id) {
        // Robustness: If resolution slipped through (e.g. absolute paths), catch it here
        if (id.endsWith('todo-solver.ts') && !id.includes('browser')) {
          console.log('[force-solver-swap] Intercepted load:', id);
          // NOTE: fs needs to be imported here if not already available in the scope
          // For this example, assuming fs is available or will be added.
          // If not, you might need to add `import fs from 'fs';` at the top of this file.
          return fs.readFileSync(path.resolve(__dirname, '../src/pie-interpreter/solver/todo-solver.browser.ts'), 'utf-8');
        }
      }
    },
    react(),
    nodePolyfills({
      exclude: ['fs'], // Keep Excluding fs to avoid conflicts if manual shim is needed again, but let's try relying on cleaner swap
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: [
      { find: 'src', replacement: path.resolve(__dirname, './src') },
      { find: '@pie-src', replacement: path.resolve(__dirname, '../src') },
    ]
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  worker: {
    plugins: () => [
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        protocolImports: true,
      })
    ]
  },
  base: './', // Ensure relative paths for GitHub Pages deployment
})
