import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Plugin to stub out Node.js built-in modules for browser bundles
function stubNodeBuiltins() {
  const stubs = {
    'fs': 'export default {}',
    'path': 'export default {}',
    'fs/promises': 'export default {}',
    'process': 'export default { argv: [] }',
    'escodegen': 'export default {}'
  };

  return {
    name: 'stub-node-builtins',
    resolveId(source) {
      if (stubs[source]) {
        return source;
      }
      return null;
    },
    load(id) {
      if (stubs[id]) {
        return stubs[id];
      }
      return null;
    }
  };
}

export default [
  // Main bundle for distribution
  {
    input: 'src/pie_interpreter/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [typescript(), nodeResolve(), terser()]
  },
  // Web worker bundle for the playground
  {
    input: 'web/worker-entry.ts',
    output: {
      file: 'web/pie-worker-bundle.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      (function workerTodoSolverStub() {
        const filename = fileURLToPath(import.meta.url);
        const dirname = path.dirname(filename);
        const browserTodoSolverPath = path.resolve(dirname, 'src/pie_interpreter/try_llm/todo_solver.browser.ts');
        return {
          name: 'worker-todo-solver-stub',
          resolveId(source) {
            if (source === '../try_llm/todo_solver') {
              return browserTodoSolverPath;
            }
            return null;
          }
        };
      })(),
      stubNodeBuiltins(), // Stub out Node.js modules before other plugins
      typescript({
        tsconfig: false,
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2020',
          lib: ['ES2022', 'DOM'],
          sourceMap: true,
          strict: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          declaration: false,
          declarationMap: false
        }
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      terser()
    ]
  },
  // LSP worker bundle for the web interface (simple version)
  {
    input: 'web/lsp/pie-language-server-simple.worker.ts',
    output: {
      file: 'web/lsp/pie-lsp-worker-bundle.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      (function workerTodoSolverStub() {
        const filename = fileURLToPath(import.meta.url);
        const dirname = path.dirname(filename);
        const browserTodoSolverPath = path.resolve(dirname, 'src/pie_interpreter/try_llm/todo_solver.browser.ts');
        return {
          name: 'worker-todo-solver-stub',
          resolveId(source) {
            if (source === '../try_llm/todo_solver' || source === '../../try_llm/todo_solver') {
              return browserTodoSolverPath;
            }
            return null;
          }
        };
      })(),
      stubNodeBuiltins(), // Stub out Node.js modules before other plugins
      typescript({
        tsconfig: false,
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2020',
          lib: ['ES2022', 'DOM', 'WebWorker'],
          sourceMap: true,
          strict: false, // Disable strict for simpler worker
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          declaration: false,
          declarationMap: false
        }
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      terser()
    ]
  },
  // LSP client bundle for the web interface (simple version without monaco-languageclient)
  {
    input: 'web/lsp/lsp-client-simple.ts',
    output: {
      file: 'web/lsp/lsp-client-bundle.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      stubNodeBuiltins(),
      typescript({
        tsconfig: false,
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2020',
          lib: ['ES2022', 'DOM'],
          sourceMap: true,
          strict: false, // Disable strict mode for Monaco any types
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          declaration: false,
          declarationMap: false
        }
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      terser()
    ]
  }
];
  
