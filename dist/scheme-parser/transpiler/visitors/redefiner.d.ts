/**
 * A visitor that evaluates all definitions in a Scheme AST.
 * If several redefinitions are made, they are converted to reassignments.
 * Required to play nice with JavaScript's scoping rules.
 */
import { Expression, Atomic, Extended } from "../types/nodes/scheme-node-types";
import { Visitor } from ".";
export declare class Redefiner implements Visitor {
    static create(): Redefiner;
    redefineScope(scope: Expression[]): Expression[];
    redefine(nodes: Expression[]): Expression[];
    visitSequence(node: Atomic.Sequence): Atomic.Sequence;
    visitNumericLiteral(node: Atomic.NumericLiteral): Atomic.NumericLiteral;
    visitBooleanLiteral(node: Atomic.BooleanLiteral): Atomic.BooleanLiteral;
    visitStringLiteral(node: Atomic.StringLiteral): Atomic.StringLiteral;
    visitLambda(node: Atomic.Lambda): Atomic.Lambda;
    visitIdentifier(node: Atomic.Identifier): Atomic.Identifier;
    visitDefinition(node: Atomic.Definition): Atomic.Definition;
    visitApplication(node: Atomic.Application): Atomic.Application;
    visitConditional(node: Atomic.Conditional): Atomic.Conditional;
    visitPair(node: Atomic.Pair): Atomic.Pair;
    visitNil(node: Atomic.Nil): Atomic.Nil;
    visitSymbol(node: Atomic.Symbol): Atomic.Symbol;
    visitSpliceMarker(node: Atomic.SpliceMarker): Atomic.SpliceMarker;
    visitReassignment(node: Atomic.Reassignment): Atomic.Reassignment;
    visitImport(node: Atomic.Import): Atomic.Import;
    visitExport(node: Atomic.Export): Atomic.Export;
    visitVector(node: Atomic.Vector): Atomic.Vector;
    visitFunctionDefinition(node: Extended.FunctionDefinition): Extended.FunctionDefinition;
    visitLet(node: Extended.Let): Extended.Let;
    visitCond(node: Extended.Cond): Extended.Cond;
    visitList(node: Extended.List): Extended.List;
    visitBegin(node: Extended.Begin): Extended.Begin;
    visitDelay(node: Extended.Delay): Extended.Delay;
    visitDefineSyntax(node: Atomic.DefineSyntax): Atomic.DefineSyntax;
    visitSyntaxRules(node: Atomic.SyntaxRules): Atomic.SyntaxRules;
}
//# sourceMappingURL=redefiner.d.ts.map