import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const aliases = {
  '@': path.resolve(__dirname, './src'),
  '@pie': path.resolve(__dirname, '../src/pie-interpreter'),
  '@scheme': path.resolve(__dirname, '../src/scheme_parser'),
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: aliases,
  },
  worker: {
    format: 'es',
    rollupOptions: {
      // Ensure aliases are applied to workers
    },
  },
  // Ensure the optimizer handles the external modules
  optimizeDeps: {
    include: ['comlink', 'nanoid'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
