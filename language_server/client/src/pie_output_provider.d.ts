import * as vscode from 'vscode';
export declare class PieOutputProvider implements vscode.TreeDataProvider<PieOutputItem> {
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<PieOutputItem | undefined | null | void>;
    private output;
    private error;
    constructor();
    refresh(): void;
    updateOutput(output: string, error?: string): void;
    getTreeItem(element: PieOutputItem): vscode.TreeItem;
    getChildren(element?: PieOutputItem): Thenable<PieOutputItem[]>;
}
export declare class PieOutputItem extends vscode.TreeItem {
    readonly label: string;
    readonly tooltip: string;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    readonly contextValue: string;
    constructor(label: string, tooltip: string, collapsibleState: vscode.TreeItemCollapsibleState, contextValue: string);
}
//# sourceMappingURL=pie_output_provider.d.ts.map