# pie-slang
Implementation of Pie, following [The Little Typer](https://mitpress.mit.edu/9780262536431/the-little-typer/)
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
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Try a simple Pie program:
   ```scheme
   (claim identity (-> Nat Nat))
   (define identity (λ (n) n))
   ```
For more information about the project, please visit our wiki pages.  
To learn more about the language, you may read the book The Little Typer. Our wiki also contains a brief overview of the language.
