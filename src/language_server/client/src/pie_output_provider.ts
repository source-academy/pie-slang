import * as vscode from 'vscode';

export class PieOutputProvider implements vscode.TreeDataProvider<PieOutputItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PieOutputItem | undefined | null | void> = new vscode.EventEmitter<PieOutputItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PieOutputItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private output: string = 'No output yet. Run some Pie code to see results.';
    private error: string | null = null;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateOutput(output: string, error?: string): void {
        this.output = output;
        this.error = error || null;
        this.refresh();
    }

    getTreeItem(element: PieOutputItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PieOutputItem): Thenable<PieOutputItem[]> {
        if (!element) {
            // Root level items
            const items: PieOutputItem[] = [];
            
            if (this.error) {
                items.push(new PieOutputItem(
                    'Error',
                    this.error,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'error'
                ));
            }
            
            if (this.output) {
                const lines = this.output.split('\n').filter(line => line.trim() !== '');
                if (lines.length > 0) {
                    items.push(new PieOutputItem(
                        'Output',
                        '',
                        vscode.TreeItemCollapsibleState.Expanded,
                        'output'
                    ));
                }
            }
            
            return Promise.resolve(items);
        } else if (element.contextValue === 'output') {
            // Show output lines as children
            const lines = this.output.split('\n').filter(line => line.trim() !== '');
            const items = lines.map(line => new PieOutputItem(
                line.trim(),
                line.trim(),
                vscode.TreeItemCollapsibleState.None,
                'line'
            ));
            return Promise.resolve(items);
        } else if (element.contextValue === 'error') {
            // Show error details as children
            const errorLines = this.error ? this.error.split('\n').filter(line => line.trim() !== '') : [];
            const items = errorLines.map(line => new PieOutputItem(
                line.trim(),
                line.trim(),
                vscode.TreeItemCollapsibleState.None,
                'errorLine'
            ));
            return Promise.resolve(items);
        }
        
        return Promise.resolve([]);
    }
}

export class PieOutputItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        
        // Set icons based on context
        switch (contextValue) {
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error');
                break;
            case 'output':
                this.iconPath = new vscode.ThemeIcon('output');
                break;
            case 'line':
                this.iconPath = new vscode.ThemeIcon('symbol-string');
                break;
            case 'errorLine':
                this.iconPath = new vscode.ThemeIcon('warning');
                break;
        }
    }
}
