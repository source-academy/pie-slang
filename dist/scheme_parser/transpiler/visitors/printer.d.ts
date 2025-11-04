import { Visitor } from ".";
import { Atomic, Extended } from "../types/nodes/scheme-node-types";
/**
 * Visitor implementation that prints the AST.
 */
export declare class Printer implements Visitor {
    indentationLevel: number;
    constructor(indentationLevel: number);
    static create(): Printer;
    increment(): Printer;
    decrement(): Printer;
    indent(): void;
    display(value: any): void;
    visitSequence(node: Atomic.Sequence): void;
    visitNumericLiteral(node: Atomic.NumericLiteral): void;
    visitBooleanLiteral(node: Atomic.BooleanLiteral): void;
    visitStringLiteral(node: Atomic.StringLiteral): void;
    visitLambda(node: Atomic.Lambda): void;
    visitIdentifier(node: Atomic.Identifier): any;
    visitDefinition(node: Atomic.Definition): any;
    visitApplication(node: Atomic.Application): any;
    visitConditional(node: Atomic.Conditional): any;
    visitPair(node: Atomic.Pair): any;
    visitNil(node: Atomic.Nil): any;
    visitSymbol(node: Atomic.Symbol): any;
    visitSpliceMarker(node: Atomic.SpliceMarker): any;
    visitReassignment(node: Atomic.Reassignment): any;
    visitImport(node: Atomic.Import): any;
    visitExport(node: Atomic.Export): any;
    visitVector(node: Atomic.Vector): void;
    visitFunctionDefinition(node: Extended.FunctionDefinition): any;
    visitLet(node: Extended.Let): any;
    visitCond(node: Extended.Cond): any;
    visitList(node: Extended.List): any;
    visitBegin(node: Extended.Begin): any;
    visitDelay(node: Extended.Delay): any;
    visitDefineSyntax(node: Atomic.DefineSyntax): void;
    visitSyntaxRules(node: Atomic.SyntaxRules): void;
}
//# sourceMappingURL=printer.d.ts.map