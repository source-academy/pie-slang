"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    try {
        // The server is implemented in node
        let serverModule = context.asAbsolutePath(path.join('out', 'server', 'src', 'server.js'));
        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(serverModule)) {
            console.error(`Server module not found at: ${serverModule}`);
            vscode.window.showErrorMessage(`Pie LSP: Server module not found at ${serverModule}`);
            return;
        }
        console.log(`Pie LSP: Starting server from ${serverModule}`);
        // ... rest of your code
        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
        let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        let serverOptions = {
            run: { module: serverModule, transport: node_1.TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: node_1.TransportKind.ipc,
                options: debugOptions
            }
        };
        // Options to control the language client
        let clientOptions = {
            // Register the server for pie documents
            documentSelector: [
                { scheme: 'file', language: 'pie' },
                { scheme: 'untitled', language: 'pie' } // Also support untitled files
            ]
        };
        // Create the language client and start the client.
        client = new node_1.LanguageClient('pie-lsp', 'Pie Language Server', serverOptions, clientOptions);
        // Start the client. This will also launch the server
        client.start().then(() => {
            console.log('Pie LSP: Client started successfully');
        }).catch((error) => {
            console.error('Pie LSP: Failed to start client:', error);
            vscode.window.showErrorMessage(`Pie LSP: Failed to start: ${error.message}`);
        });
    }
    catch (error) {
        console.error('Pie LSP: Error in activate:', error);
        vscode.window.showErrorMessage(`Pie LSP: Activation error: ${error}`);
    }
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map