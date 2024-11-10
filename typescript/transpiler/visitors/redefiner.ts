/**
 * A visitor that evaluates all definitions in a Scheme AST.
 * If several redefinitions are made, they are converted to reassignments.
 * Required to play nice with JavaScript's scoping rules.
 */

import { Expression, Atomic, Extended } from "../types/nodes/scheme-node-types";
import { Visitor } from ".";

export class Redefiner implements Visitor {
  // Factory method for creating a new Redefiner instance.
  public static create(): Redefiner {
    return new Redefiner();
  }

  redefineScope(scope: Expression[]): Expression[] {
    const names = new Set<string>();
    const newScope = scope.map(expression => {
      if (expression instanceof Atomic.Definition) {
        const exprName = expression.name.name;
        if (names.has(exprName)) {
          return new Atomic.Reassignment(
            expression.location,
            expression.name,
            expression.value
          );
        }
        names.add(exprName);
      }
      return expression;
    });
    return newScope;
  }

  public redefine(nodes: Expression[]): Expression[] {
    // recursivly redefine the scope of the nodes
    // then work directly on the new nodes
    const newNodes = nodes.map(node => node.accept(this));
    return this.redefineScope(newNodes);
  }

  // Atomic AST
  visitSequence(node: Atomic.Sequence): Atomic.Sequence {
    const location = node.location;
    const newExpressions = node.expressions.map(expression =>
      expression.accept(this)
    );
    return new Atomic.Sequence(location, this.redefineScope(newExpressions));
  }

  visitNumericLiteral(node: Atomic.NumericLiteral): Atomic.NumericLiteral {
    return node;
  }

  visitBooleanLiteral(node: Atomic.BooleanLiteral): Atomic.BooleanLiteral {
    return node;
  }

  visitStringLiteral(node: Atomic.StringLiteral): Atomic.StringLiteral {
    return node;
  }

  visitLambda(node: Atomic.Lambda): Atomic.Lambda {
    const location = node.location;
    const params = node.params;
    const rest = node.rest;
    const newBody = node.body.accept(this);

    return new Atomic.Lambda(location, newBody, params, rest);
  }

  visitIdentifier(node: Atomic.Identifier): Atomic.Identifier {
    return node;
  }

  visitDefinition(node: Atomic.Definition): Atomic.Definition {
    const location = node.location;
    const name = node.name;
    const newValue = node.value.accept(this);

    return new Atomic.Definition(location, name, newValue);
  }

  visitApplication(node: Atomic.Application): Atomic.Application {
    const location = node.location;
    const newOperator = node.operator.accept(this);
    const newOperands = node.operands.map(operand => operand.accept(this));

    return new Atomic.Application(location, newOperator, newOperands);
  }

  visitConditional(node: Atomic.Conditional): Atomic.Conditional {
    const location = node.location;
    const newTest = node.test.accept(this);
    const newConsequent = node.consequent.accept(this);
    const newAlternate = node.alternate.accept(this);

    return new Atomic.Conditional(
      location,
      newTest,
      newConsequent,
      newAlternate
    );
  }

  visitPair(node: Atomic.Pair): Atomic.Pair {
    const location = node.location;
    const newCar = node.car.accept(this);
    const newCdr = node.cdr.accept(this);

    return new Atomic.Pair(location, newCar, newCdr);
  }

  visitNil(node: Atomic.Nil): Atomic.Nil {
    return node;
  }

  visitSymbol(node: Atomic.Symbol): Atomic.Symbol {
    return node;
  }

  visitSpliceMarker(node: Atomic.SpliceMarker) {
    const location = node.location;
    const newValue = node.value.accept(this);

    return new Atomic.SpliceMarker(location, newValue);
  }

  visitReassignment(node: Atomic.Reassignment): Atomic.Reassignment {
    const location = node.location;
    const name = node.name;
    const newValue = node.value.accept(this);

    return new Atomic.Reassignment(location, name, newValue);
  }

  // Already in simplest form.
  visitImport(node: Atomic.Import): Atomic.Import {
    return node;
  }

  visitExport(node: Atomic.Export): Atomic.Export {
    const location = node.location;
    const newDefinition = node.definition.accept(this);

    return new Atomic.Export(location, newDefinition);
  }

  visitVector(node: Atomic.Vector) {
    const location = node.location;

    // Simplify the elements of the vector
    const newElements = node.elements.map(element => element.accept(this));

    return new Atomic.Vector(location, newElements);
  }

  // Extended AST
  visitFunctionDefinition(
    node: Extended.FunctionDefinition
  ): Extended.FunctionDefinition {
    const location = node.location;
    const name = node.name;
    const params = node.params;
    const rest = node.rest;
    const newBody = node.body.accept(this);

    return new Extended.FunctionDefinition(
      location,
      name,
      newBody,
      params,
      rest
    );
  }

  visitLet(node: Extended.Let): Extended.Let {
    const location = node.location;
    const identifiers = node.identifiers;
    const newValues = node.values.map(value => value.accept(this));
    const newBody = node.body.accept(this);

    return new Extended.Let(location, identifiers, newValues, newBody);
  }

  visitCond(node: Extended.Cond): Extended.Cond {
    const location = node.location;
    const newPredicates = node.predicates.map(predicate =>
      predicate.accept(this)
    );
    const newConsequents = node.consequents.map(consequent =>
      consequent.accept(this)
    );
    const newCatchall = node.catchall
      ? node.catchall.accept(this)
      : node.catchall;
    return new Extended.Cond(
      location,
      newPredicates,
      newConsequents,
      newCatchall
    );
  }

  visitList(node: Extended.List): Extended.List {
    const location = node.location;
    const newElements = node.elements.map(element => element.accept(this));
    const newTerminator = node.terminator
      ? node.terminator.accept(this)
      : undefined;
    return new Extended.List(location, newElements, newTerminator);
  }

  visitBegin(node: Extended.Begin): Extended.Begin {
    const location = node.location;
    const newExpressions = node.expressions.map(expression =>
      expression.accept(this)
    );

    return new Extended.Begin(location, this.redefineScope(newExpressions));
  }

  visitDelay(node: Extended.Delay): Extended.Delay {
    const location = node.location;
    const newBody = node.expression.accept(this);

    return new Extended.Delay(location, newBody);
  }

  // there are no redefinitions in the following nodes.
  visitDefineSyntax(node: Atomic.DefineSyntax) {
    return node;
  }

  visitSyntaxRules(node: Atomic.SyntaxRules) {
    return node;
  }
}
