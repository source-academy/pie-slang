# Browser-Based Language Server for Pie

This directory contains a browser-compatible version of the Pie language server that can be used in the web interface deployed on GitHub Pages.

## Overview

The browser-based language server provides language support features for Pie code directly in the browser:

- **Syntax Highlighting**: Full syntax highlighting for Pie language constructs
- **Diagnostics**: Real-time error checking and type checking as you type
- **Language Features** (in progress): Hover tooltips, go-to-definition, code completion

## Architecture

The implementation consists of two main components:

### 1. Language Server Worker (`pie-language-server-simple.worker.ts`)

A Web Worker that runs the Pie type checker and provides diagnostics. It:
- Parses Pie source code
- Performs type checking using the Pie interpreter
- Returns diagnostics (errors and warnings) with line/column information

**Built as**: `pie-lsp-worker-bundle.js` (175KB)

### 2. LSP Client (`lsp-client-simple.ts`)

A client that:
- Registers the Pie language with Monaco Editor
- Provides syntax highlighting configuration
- Manages the language server worker
- Will integrate LSP features when Monaco supports them

**Built as**: `lsp-client-bundle.js` (2.2KB)

## Usage

The language server is automatically loaded in the web interface (`web/app.js`):

```javascript
// In app.js:
async function initializeLSP() {
  try {
    const { PieLanguageClient, registerPieLanguage } = await import('./lsp/lsp-client-bundle.js');

    // Register Pie language for Monaco
    registerPieLanguage(window.monaco);

    // Start LSP client (manages the worker)
    const lspClient = new PieLanguageClient();
    await lspClient.start();

    return lspClient;
  } catch (error) {
    console.error('Failed to initialize LSP client:', error);
    return null;
  }
}
```

## Building

The bundles are automatically built when you run:

```bash
npm run build
```

This uses Rollup to create browser-compatible bundles from TypeScript source.

## Features

### Current Features

✅ **Syntax Highlighting**
- Keywords: `lambda`, `λ`, `Pi`, `Π`, `Sigma`, `Σ`, `define`, `claim`, etc.
- Types: `Nat`, `Atom`, `List`, `Vec`, `Either`, etc.
- Operators: `->`, `→`, `=`, `::`
- Comments: Line comments (`;`) and block comments (`#| |#`)

✅ **Type Checking via Worker**
- Real-time validation as you type
- Proper error messages with locations
- Support for all Pie constructs

### Future Enhancements

🔄 **LSP Protocol Integration**
- Full Language Server Protocol support
- Hover information for built-in and user-defined symbols
- Go-to-definition for user-defined functions
- Auto-completion suggestions

## Files

- `pie-language-server-simple.worker.ts` - Worker implementation
- `lsp-client-simple.ts` - Client implementation
- `pie-lsp-worker-bundle.js` - Built worker bundle
- `lsp-client-bundle.js` - Built client bundle

## Dependencies

- Monaco Editor (loaded via CDN)
- Pie interpreter modules (bundled)

## Notes

This is a simplified implementation that doesn't use the full `monaco-languageclient` library to avoid version conflicts and reduce bundle size. The current diagnostics are provided through the existing diagnostics worker, while the LSP client focuses on syntax highlighting and language registration.

For full LSP features (hover, completion, etc.), the language server worker would need to implement the Language Server Protocol message passing, which can be added incrementally.
