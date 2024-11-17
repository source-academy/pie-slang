/**
 * Visitor interface for the AST.
 * Allows us to traverse the AST and perform operations on it.
 */

import { Atomic, Extended } from "../types/nodes/scheme-node-types";

export interface Visitor {
  // Atomic AST
  visitSequence(node: Atomic.Sequence): any;

  visitNumericLiteral(node: Atomic.NumericLiteral): any;
  visitBooleanLiteral(node: Atomic.BooleanLiteral): any;
  visitStringLiteral(node: Atomic.StringLiteral): any;
  visitLambda(node: Atomic.Lambda): any;

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

  visitVector(node: Atomic.Vector): any;

  visitSyntaxRules(node: Atomic.SyntaxRules): any;
  visitDefineSyntax(node: Atomic.DefineSyntax): any;

  // Extended AST
  visitFunctionDefinition(node: Extended.FunctionDefinition): any;
  visitLet(node: Extended.Let): any;
  visitCond(node: Extended.Cond): any;

  visitList(node: Extended.List): any;

  visitBegin(node: Extended.Begin): any;
  visitDelay(node: Extended.Delay): any;
}
