# pie-slang

Implementation of Pie, following [The Little Typer](https://mitpress.mit.edu/9780262536431/the-little-typer/)

## Our Online Playground

We have an [online playground](https://source-academy.github.io/pie-slang/) for you to play with Pie.
It is still under construction, especially for the language server part, so it might be buggy.

## Our Language Server

We have published the Pie language server as a VSCode extension, named [pie-lsp](https://marketplace.visualstudio.com/items?itemName=DaoxinLi.pie-lsp&ssr=false#review-details)

## React Playground (New)

We are developing a modern React-based playground to replace the legacy web interface.
*Source code located in `pie-react/` directory.*

### Branch: `react-playground`

This branch contains the working React playground with the latest fixes for running the interpreter in the browser.
It is the branch you should use for local development and for the GitHub Pages demo.

### Online Demo (GitHub Pages via Actions)

This repository already includes a GitHub Actions workflow that deploys the React playground on every push to `react-playground`:
`.github/workflows/deploy-playground.yml`

To enable the demo on your fork:
1. Go to **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Push to `react-playground` (or re-run the workflow in the Actions tab).

Your demo URL will be:
`https://<your-username>.github.io/pie-slang/`

### Run Locally (React Playground)

```bash
cd pie-react
npm install
npm run dev
```

## Getting Started

To get started with the Pie interpreter:

1. Clone the repository:

   ```bash
   git clone https://github.com/source-academy/pie-slang.git
   cd pie-slang
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Build the project:

   ```bash
   yarn build
   ```

4. Use conductor: find dist files in `./dist` folder.

5. Try a simple Pie program on Source Academy, or the local web interface:
   ```scheme
   (claim identity (-> Nat Nat))
   (define identity (λ (n) n))
   ```
   For more information about the project, please visit our wiki pages.
   To learn more about the language, you may read the book The Little Typer. Our wiki also contains a brief overview of the language.

## Running the Legacy Frontend Locally

Once you have built the project, you can run the frontend locally:

1. Install the `Live Server` extension in VSCode.
2. Navigate to the web dir
3. Right click on `index.html` and select `Open with Live Server`.

Caveat: Opening the html file directly in the browser gives rise to cors errors and the editor will not be loaded.
