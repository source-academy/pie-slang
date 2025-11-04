import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from '@rollup/plugin-typescript';

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
      stubNodeBuiltins(), // Stub out Node.js modules before other plugins
      typescript({
        tsconfig: false,
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2020',
          lib: ['ES2020', 'DOM'],
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
  }
];
  
