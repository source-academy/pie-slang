import * as vscode from 'vscode';
import { PieOutputProvider } from './pie-output-provider';

export class PieCommandHandler {
  constructor(private outputProvider: PieOutputProvider) { }

  async runPieCode(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    if (activeEditor.document.languageId !== 'pie') {
      vscode.window.showErrorMessage('Current file is not a Pie file');
      return;
    }

    const code = activeEditor.document.getText();

    if (!code.trim()) {
      vscode.window.showWarningMessage('No code to execute');
      return;
    }

    try {
      // Show progress indicator
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running Pie Code...",
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0 });

        try {
          progress.report({ increment: 50, message: "Evaluating..." });

          // Get the evaluatePie function
          const pieModule = this.getEvaluatePieFunction();
          const result = pieModule.evaluatePie(code);

          progress.report({ increment: 100, message: "Complete" });

          // Update the output provider with results
          this.outputProvider.updateOutput(result || 'Execution completed successfully (no output)');
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.outputProvider.updateOutput('', errorMessage);
          vscode.window.showErrorMessage(`Execution failed: ${errorMessage}`);
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to run Pie code: ${errorMessage}`);
    }
  }

  private getEvaluatePieFunction(): { evaluatePie: (code: string) => string } {
    try {
      // Use dynamic require to load the compiled module
      // This is necessary because we need the compiled JavaScript version
      const modulePath = require.resolve('../../out/src/pie-interpreter/main');
      // Clear the require cache to ensure we get the latest version
      delete require.cache[modulePath];
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pieModule = require(modulePath);

      if (pieModule && typeof pieModule.evaluatePie === 'function') {
        return pieModule;
      }

      throw new Error('evaluatePie function not found in module');
    } catch (error) {
      // If import fails, show error with helpful message
      throw new Error(`Could not load Pie interpreter. Make sure the extension is compiled. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  refreshOutput(): void {
    this.outputProvider.refresh();
  }
}
