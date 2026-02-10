import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

console.log('Vite config loaded!');

const todoSolverBrowserPath = path.resolve(
  __dirname,
  '../src/pie-interpreter/solver/todo-solver.browser.ts'
);
const polyfillShim = (name: string) =>
  path.resolve(
    __dirname,
    `node_modules/vite-plugin-node-polyfills/shims/${name}/dist/index.js`
  );

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      exclude: ['fs'],
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
      { find: 'vite-plugin-node-polyfills/shims/buffer', replacement: polyfillShim('buffer') },
      { find: 'vite-plugin-node-polyfills/shims/global', replacement: polyfillShim('global') },
      { find: 'vite-plugin-node-polyfills/shims/process', replacement: polyfillShim('process') },
      // Force swap todo-solver to browser version (for the React build)
      { find: '../solver/todo-solver', replacement: todoSolverBrowserPath },
      { find: '../solver/todo-solver.ts', replacement: todoSolverBrowserPath }
    ]
  },
  server: {
    fs: {
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
    ],
    format: 'es',
  },
  base: './',
})
