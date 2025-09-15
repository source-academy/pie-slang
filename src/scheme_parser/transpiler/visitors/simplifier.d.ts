/**
 * A visitor that transforms all "extended AST" nodes into "atomic AST" nodes.
 * Except for everything inside a quote, which is left alone.
 *
 * It also does double work by "flattening" begin nodes whenever possible, to allow definitions
 * to be visible outside the begin structure (since begins don't have their own scope).
 */
import { Expression, Atomic, Extended } from "../types/nodes/scheme-node-types";
import { Visitor } from ".";
export declare class Simplifier implements Visitor {
    static create(): Simplifier;
    simplify(node: Expression[]): Expression[];
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
    visitFunctionDefinition(node: Extended.FunctionDefinition): Atomic.Definition;
    visitLet(node: Extended.Let): Atomic.Application;
    visitCond(node: Extended.Cond): Expression;
    visitList(node: Extended.List): Expression;
    visitBegin(node: Extended.Begin): Atomic.Sequence;
    visitDelay(node: Extended.Delay): Atomic.Application;
    visitDefineSyntax(node: Atomic.DefineSyntax): Atomic.DefineSyntax;
    visitSyntaxRules(node: Atomic.SyntaxRules): Atomic.SyntaxRules;
}
//# sourceMappingURL=simplifier.d.ts.map