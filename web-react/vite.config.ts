/// <reference types="vitest" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const aliasEntries = [
  { find: "@", replacement: path.resolve(__dirname, "./src") },
  {
    find: "@pie",
    replacement: path.resolve(__dirname, "../src/pie-interpreter"),
  },
  {
    find: "@scheme",
    replacement: path.resolve(__dirname, "../src/scheme-parser"),
  },
  // Explicitly resolve @google/genai to web-react/node_modules so that files
  // resolved via @pie aliases (which live outside this directory) can still
  // find the package installed here.
  {
    find: "@google/genai",
    replacement: path.resolve(__dirname, "node_modules/@google/genai"),
  },
];

// Create a custom alias plugin with enforce: 'pre' to run before vite:import-analysis
function customAliasPlugin(): Plugin {
  return {
    name: "custom-alias",
    enforce: "pre",
    resolveId(source, importer) {
      // Skip if no importer or if it's a node_modules path
      if (!importer || importer.includes("node_modules")) {
        return null;
      }

      for (const entry of aliasEntries) {
        if (source === entry.find || source.startsWith(entry.find + "/")) {
          const resolved = source.replace(entry.find, entry.replacement);
          return resolved;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  base: "/pie-slang/pie-playground/",
  plugins: [customAliasPlugin(), react()],
  resolve: {
    alias: aliasEntries,
  },
  worker: {
    format: "es",
    plugins: () => [customAliasPlugin()],
  },
  // Ensure the optimizer handles the external modules
  optimizeDeps: {
    include: ["comlink", "nanoid"],
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
