/**
 * The final transpiler visitor.
 * Takes in expressions, yields es.Node[], so we can flatmap into a final program
 */
import * as es from "estree";
import { Atomic, Extended, Expression as scmExpression } from "../types/nodes/scheme-node-types";
import { Visitor } from ".";
export declare class Transpiler implements Visitor {
    static create(): Transpiler;
    transpile(program: scmExpression[]): es.Program;
    visitSequence(node: Atomic.Sequence): [es.CallExpression];
    visitNumericLiteral(node: Atomic.NumericLiteral): [es.CallExpression];
    visitBooleanLiteral(node: Atomic.BooleanLiteral): [es.Literal];
    visitStringLiteral(node: Atomic.StringLiteral): [es.Literal];
    visitLambda(node: Atomic.Lambda): [es.ArrowFunctionExpression];
    visitIdentifier(node: Atomic.Identifier): [es.Identifier];
    visitDefinition(node: Atomic.Definition): [es.VariableDeclaration];
    visitApplication(node: Atomic.Application): [es.CallExpression];
    visitConditional(node: Atomic.Conditional): [es.ConditionalExpression];
    visitPair(node: Atomic.Pair): [es.CallExpression];
    visitNil(node: Atomic.Nil): [es.Literal];
    visitSymbol(node: Atomic.Symbol): [es.CallExpression];
    visitSpliceMarker(node: Atomic.SpliceMarker): [es.CallExpression];
    visitReassignment(node: Atomic.Reassignment): [es.AssignmentExpression];
    visitImport(node: Atomic.Import): (es.Statement | es.ModuleDeclaration)[];
    visitExport(node: Atomic.Export): [es.ModuleDeclaration];
    visitVector(node: Atomic.Vector): [es.ArrayExpression];
    visitList(node: Extended.List): [es.CallExpression];
    visitFunctionDefinition(node: Extended.FunctionDefinition): [es.VariableDeclaration];
    visitLet(node: Extended.Let): [es.CallExpression];
    visitCond(node: Extended.Cond): [es.ConditionalExpression];
    visitBegin(node: Extended.Begin): [es.CallExpression];
    visitDelay(node: Extended.Delay): [es.ArrowFunctionExpression];
    visitDefineSyntax(node: Atomic.DefineSyntax): void;
    visitSyntaxRules(node: Atomic.SyntaxRules): void;
}
//# sourceMappingURL=transpiler.d.ts.map