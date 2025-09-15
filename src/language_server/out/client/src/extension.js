"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
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