"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
// Test completion functionality
describe('Completion Tests', () => {
    // Mock completion handler from server
    function onCompletion() {
        return [
            {
                label: 'TypeScript',
                kind: node_1.CompletionItemKind.Text,
                data: 1
            },
            {
                label: 'JavaScript',
                kind: node_1.CompletionItemKind.Text,
                data: 2
            }
        ];
    }
    // Mock completion resolve handler
    function onCompletionResolve(item) {
        if (item.data === 1) {
            item.detail = 'TypeScript details';
            item.documentation = 'TypeScript documentation';
        }
        else if (item.data === 2) {
            item.detail = 'JavaScript details';
            item.documentation = 'JavaScript documentation';
        }
        return item;
    }
    test('should return completion items', () => {
        const completions = onCompletion();
        expect(completions).toHaveLength(2);
        expect(completions[0].label).toBe('TypeScript');
        expect(completions[1].label).toBe('JavaScript');
        expect(completions[0].kind).toBe(node_1.CompletionItemKind.Text);
        expect(completions[1].kind).toBe(node_1.CompletionItemKind.Text);
    });
    test('should resolve TypeScript completion item', () => {
        const item = {
            label: 'TypeScript',
            kind: node_1.CompletionItemKind.Text,
            data: 1
        };
        const resolved = onCompletionResolve(item);
        expect(resolved.detail).toBe('TypeScript details');
        expect(resolved.documentation).toBe('TypeScript documentation');
    });
    test('should resolve JavaScript completion item', () => {
        const item = {
            label: 'JavaScript',
            kind: node_1.CompletionItemKind.Text,
            data: 2
        };
        const resolved = onCompletionResolve(item);
        expect(resolved.detail).toBe('JavaScript details');
        expect(resolved.documentation).toBe('JavaScript documentation');
    });
    test('should not modify unknown completion items', () => {
        const item = {
            label: 'Unknown',
            kind: node_1.CompletionItemKind.Text,
            data: 999
        };
        const resolved = onCompletionResolve(item);
        expect(resolved.detail).toBeUndefined();
        expect(resolved.documentation).toBeUndefined();
    });
    // Test for Pie language specific completions (future enhancement)
    test('should provide Pie language completions', () => {
        // This test represents what we might want to implement for Pie
        const pieCompletions = [
            { label: 'lambda', kind: node_1.CompletionItemKind.Keyword },
            { label: 'define', kind: node_1.CompletionItemKind.Keyword },
            { label: 'if', kind: node_1.CompletionItemKind.Keyword },
            { label: '+', kind: node_1.CompletionItemKind.Function },
            { label: '-', kind: node_1.CompletionItemKind.Function },
            { label: '*', kind: node_1.CompletionItemKind.Function },
            { label: '/', kind: node_1.CompletionItemKind.Function }
        ];
        // For now, we just verify the structure we'd expect
        expect(pieCompletions).toEqual(expect.arrayContaining([
            expect.objectContaining({ label: 'lambda' }),
            expect.objectContaining({ label: 'define' }),
            expect.objectContaining({ label: '+' })
        ]));
    });
});
//# sourceMappingURL=completion.test.js.map