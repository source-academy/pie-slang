import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/pie_interpreter/index.ts',  // Entry file
    output: {
      file: 'dist/index.js',  // Output file
      format: 'iife',  // Output format (options: 'esm', 'cjs', 'iife', 'umd')
      sourcemap: true  // Generates a source map for debugging
    },
    plugins: [typescript(), nodeResolve(), terser()]  // Use the typescript plugin
  };
  
