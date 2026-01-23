import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

import { PieOutputProvider } from './pie-output-provider';
import { PieCommandHandler } from './pie-command-handler';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  
  // Initialize the Pie output provider and command handler
  const outputProvider = new PieOutputProvider();
  const commandHandler = new PieCommandHandler(outputProvider);

  // Register the tree data provider for the sidebar
  vscode.window.registerTreeDataProvider('pieOutput', outputProvider);

  // Register commands
  const runCommand = vscode.commands.registerCommand('pie.runCode', () => {
    commandHandler.runPieCode();
  });

  const refreshCommand = vscode.commands.registerCommand('pie.refreshOutput', () => {
    commandHandler.refreshOutput();
  });

  context.subscriptions.push(runCommand, refreshCommand);

  try {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('out', 'src', 'language_server', 'server', 'src', 'server.js'));
    
    // Check if file exists
    if (!fs.existsSync(serverModule)) {
      vscode.window.showErrorMessage(`Pie LSP: Server module not found at ${serverModule}`);
      return;
    }
    
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions
      }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      // Register the server for pie documents
      documentSelector: [
        { scheme: 'file', language: 'pie' },
        { scheme: 'untitled', language: 'pie' }  // Also support untitled files
      ]
    };

    // Create the language client and start the client.
    client = new LanguageClient(
      'pie-lsp',
      'Pie Language Server',
      serverOptions,
      clientOptions
    );
    // Start the client. This will also launch the server
    client.start().then(() => {
      // Client started successfully
    }).catch((error) => {
      vscode.window.showErrorMessage(`Pie LSP: Failed to start: ${error.message}`);
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Pie LSP: Activation error: ${error}`);
  }
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
