/**
 * Visitor interface for the AST.
 * Allows us to traverse the AST and perform operations on it.
 */

import { Atomic, Extended } from "../types/nodes/scheme-node-types";

export interface Visitor {
  // Atomic AST
  visitSequence(node: Atomic.Sequence): unknown;

  visitNumericLiteral(node: Atomic.NumericLiteral): unknown;
  visitBooleanLiteral(node: Atomic.BooleanLiteral): unknown;
  visitStringLiteral(node: Atomic.StringLiteral): unknown;
  visitLambda(node: Atomic.Lambda): unknown;

  visitIdentifier(node: Atomic.Identifier): unknown;
  visitDefinition(node: Atomic.Definition): unknown;

  visitApplication(node: Atomic.Application): unknown;
  visitConditional(node: Atomic.Conditional): unknown;

  visitPair(node: Atomic.Pair): unknown;
  visitNil(node: Atomic.Nil): unknown;
  visitSymbol(node: Atomic.Symbol): unknown;
  visitSpliceMarker(node: Atomic.SpliceMarker): unknown;

  visitReassignment(node: Atomic.Reassignment): unknown;

  visitImport(node: Atomic.Import): unknown;
  visitExport(node: Atomic.Export): unknown;

  visitVector(node: Atomic.Vector): unknown;

  visitSyntaxRules(node: Atomic.SyntaxRules): unknown;
  visitDefineSyntax(node: Atomic.DefineSyntax): unknown;

  // Extended AST
  visitFunctionDefinition(node: Extended.FunctionDefinition): unknown;
  visitLet(node: Extended.Let): unknown;
  visitCond(node: Extended.Cond): unknown;

  visitList(node: Extended.List): unknown;

  visitBegin(node: Extended.Begin): unknown;
  visitDelay(node: Extended.Delay): unknown;
}
