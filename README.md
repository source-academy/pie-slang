# pie-slang

Implementation of Pie, following [The Little Typer](https://mitpress.mit.edu/9780262536431/the-little-typer/)

## Our Online Playground

We have a [online playground](https://source-academy.github.io/pie-slang/) for you to play with Pie.
It is still under construction, especially for the language server part, so it might be buggy.

## Our Language Server

We have published the Pie language server as a VSCode extension, named [pie-lsp](https://marketplace.visualstudio.com/items?itemName=DaoxinLi.pie-lsp&ssr=false#review-details)

## Getting Started

To get started with the Pie interpreter:

1. Clone the repository:

   ```bash
   git clone https://github.com/source-academy/pie-slang.git
   cd pie-slang
   ```

2. Install dependencies:

   ```bash
   nvm install
   nvm use
   npm ci
   ```

   Use Node.js 22 (the exact version is in `.nvmrc`). If you do not use nvm,
   install that Node.js version with your preferred version manager.
   Keep `package-lock.json` in version control; do not mix npm and Yarn installs.

3. Build the project:

   ```bash
   npm run build
   ```

4. Use conductor: find dist files in `./dist` folder.

5. Try a simple Pie program on Source Academy, or the local web interface:
   ```scheme
   (claim identity (-> Nat Nat))
   (define identity (λ (n) n))
   ```
   For more information about the project, please visit our wiki pages.
   To learn more about the language, you may read the book The Little Typer. Our wiki also contains a brief overview of the language.

## Running the Frontend Locally

Once you have built the project, you can run the frontend locally:

1. Install the `Live Server` extension in VSCode.
2. Navigate to the web dir
3. Right click on `index.html` and select `Open with Live Server`.

Caveat: Opening the html file directly in the browser gives rise to cors errors and the editor will not be loaded.

## Development checks

```bash
npm test -- --runInBand
npm run lint
npm run typecheck
npm run build
```

The language server is a separate npm project with its own lockfile:

```bash
npm ci --prefix src/language-server
npm run compile --prefix src/language-server
```

Its compiler follows imports from the client and server entry points; the root
type check also covers the unused legacy Scheme tools. A successful Rollup
build is not a substitute for a successful type check.
