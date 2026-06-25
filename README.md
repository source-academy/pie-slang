# pie-slang

Implementation of Pie, following [The Little Typer](https://mitpress.mit.edu/9780262536431/the-little-typer/)

## Our Online Playground

We have an [online playground](https://source-academy.github.io/pie-slang/) for you to play with Pie.
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
   yarn install
   ```

3. Build the project:

   ```bash
   yarn build
   ```

4. Use conductor: find dist files in `./dist` folder.

5. Try a simple Pie program in our [online playground](https://source-academy.github.io/pie-slang/):
   ```scheme
   (claim identity (-> Nat Nat))
   (define identity (λ (n) n))
   ```
   For more information about the project, please visit our wiki pages.
   To learn more about the language, you may read the book The Little Typer. Our wiki also contains a brief overview of the language.

## Tactic Predictor: Theorems, Fine-Tuning, and Evaluation

The tactic predictor is fine-tuned on proofs written in Pie:

- **Theorem corpus.** The hand-written theorems and their tactic proofs live under
  `src/pie-interpreter/__tests__/tactics-math-tactic/` and
  `src/pie-interpreter/__tests__/tactics-math-complex/`.
- **Datasets.** `training/` holds the extracted training data
  (`training-data-clean.jsonl`, `training-data-lora-*.jsonl`) and the held-out
  test set (`test-proofs.jsonl`, 157 theorems / 706 steps).
- **Fine-tuning and evaluation.** `training/train.py` fine-tunes a LoRA adapter over
  a public base model; `training/eval-holdout.ts` and `training/evaluate_offline.py`
  reproduce the held-out evaluation (see `training/HOLDOUT_EVAL.md`). A
  `training/Dockerfile` rebuilds the inference image.

The fine-tuned LoRA adapter is large and is not stored in this repository; it is
distributed separately.
