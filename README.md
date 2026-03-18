# pie-slang

Implementation of Pie, following [The Little Typer](https://mitpress.mit.edu/9780262536431/the-little-typer/)

## Our Online Playground

We have a [online playground](https://source-academy.github.io/pie-slang/) for you to play with Pie.
It is still under construction, especially for the language server part, so it might be buggy.

yarn build python -m http.server 8000
# Then open http://localhost:8000/web/index.html

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

## Running the Frontend Locally

Once you have built the project, you can run the frontend locally:

1. Install the `Live Server` extension in VSCode.
2. Navigate to the web dir
3. Right click on `index.html` and select `Open with Live Server`.

Caveat: Opening the html file directly in the browser gives rise to cors errors and the editor will not be loaded.

## Generating Tactic Training Data

The interpreter can automatically capture tactic proof steps as training data for AI models. Set the `COLLECT_TRAINING_DATA` env var to an output file path, then run the tactic tests:

```bash
COLLECT_TRAINING_DATA=training-data.jsonl npx jest --testPathPatterns="tactics-math" --runInBand --no-coverage
```

Or use the convenience script:

```bash
npx ts-node src/pie-interpreter/scripts/extract-training-data.ts [output-path]
```

Output is JSONL, one line per tactic step. Only successful proofs produce data. Each line contains:

```json
{
  "theoremName": "n+0=n",
  "theoremType": "(Π ((n Nat)) (= Nat (+ n 0) n))",
  "stepIndex": 0,
  "globalContext": [{"name": "+", "type": "(→ Nat Nat Nat)"}],
  "localContext": [],
  "goal": "(Π ((n Nat)) (= Nat (+ n 0) n))",
  "tactic": "intro n"
}
```
