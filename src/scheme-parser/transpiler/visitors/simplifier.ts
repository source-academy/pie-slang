/**
 * A visitor that transforms all "extended AST" nodes into "atomic AST" nodes.
 * Except for everything inside a quote, which is left alone.
 *
 * It also does double work by "flattening" begin nodes whenever possible, to allow definitions
 * to be visible outside the begin structure (since begins don't have their own scope).
 */

import { Expression, Atomic, Extended } from "../types/nodes/scheme-node-types";
import { Location } from "../types/location";
import { Visitor } from ".";

// a function that takes an expression and returns an array of expressions
// we will use this to "remove" the begin node whenever possible by returning its expressions
// this is useful when the begin is in a sequence, to allow its side effects to be visible
// outside the begin block
function flattenBegin(ex: Expression): Expression[] {
  if (!(ex instanceof Extended.Begin)) {
    return [ex];
  }

  const beginExpressions = ex.expressions;

  // these expressions may themselves contain begin nodes
  // that need to be flattened
  return beginExpressions.flatMap(flattenBegin);
}

export class Simplifier implements Visitor {
  // Factory method for creating a new Simplifier instance.
  public static create(): Simplifier {
    return new Simplifier();
  }

  public simplify(node: Expression[]): Expression[] {
    const flattenedExpressions = node.flatMap(flattenBegin);
    return flattenedExpressions.map(expression => expression.accept(this));
  }

  // Atomic AST
  visitSequence(node: Atomic.Sequence): Atomic.Sequence {
    const location = node.location;
    const flattenedExpressions = node.expressions.flatMap(flattenBegin);
    const newExpressions = flattenedExpressions.map(expression =>
      expression.accept(this)
    );
    return new Atomic.Sequence(location, newExpressions);
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
  ): Atomic.Definition {
    const location = node.location;
    const name = node.name;
    const params = node.params;
    const rest = node.rest;
    const newBody = node.body.accept(this);

    const newLambda = new Atomic.Lambda(location, newBody, params, rest);
    return new Atomic.Definition(location, name, newLambda);
  }

  visitLet(node: Extended.Let): Atomic.Application {
    const location = node.location;
    const identifiers = node.identifiers;
    const newValues = node.values.map(value => value.accept(this));
    const newBody = node.body.accept(this);

    const newLambda = new Atomic.Lambda(location, newBody, identifiers);
    return new Atomic.Application(location, newLambda, newValues);
  }

  visitCond(node: Extended.Cond): Expression {
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

    if (newPredicates.length == 0) {
      // Return catchall if there is no predicate
      return new Atomic.Conditional(
        location,
        new Atomic.BooleanLiteral(location, false),
        new Atomic.Nil(location),
        node.catchall ? newCatchall : new Atomic.Nil(location)
      );
    }

    newPredicates.reverse();
    newConsequents.reverse();
    const lastLocation = newPredicates[0].location;
    let newConditional = newCatchall
      ? newCatchall
      : new Atomic.Nil(lastLocation);

    for (let i = 0; i < newPredicates.length; i++) {
      const predicate = newPredicates[i];
      const consequent = newConsequents[i];
      const predLocation = predicate.location;
      const consLocation = consequent.location;
      const newLocation = new Location(predLocation.start, consLocation.end);
      newConditional = new Atomic.Conditional(
        newLocation,
        predicate,
        consequent,
        newConditional
      );
    }

    return newConditional;
  }

  // we will keep list as it is useful in its current state.
  visitList(node: Extended.List): Expression {
    const location = node.location;
    const newElements = node.elements.map(element => element.accept(this));
    const newTerminator = node.terminator
      ? node.terminator.accept(this)
      : undefined;
    return new Extended.List(location, newElements, newTerminator);
  }

  // these begins are not located at the top level, or in sequences,
  // so they have been left alone
  // they are used as ways to sequence expressions locally instead
  visitBegin(node: Extended.Begin): Atomic.Sequence {
    const location = node.location;
    const flattenedExpressions = node.expressions.flatMap(flattenBegin);
    const newExpressions = flattenedExpressions.map(expression =>
      expression.accept(this)
    );

    return new Atomic.Sequence(location, newExpressions);
  }

  // we transform delay into a call expression of "make-promise"
  visitDelay(node: Extended.Delay): Atomic.Application {
    const location = node.location;
    const newBody = node.expression.accept(this);
    const delayedLambda = new Atomic.Lambda(location, newBody, []);
    const makePromise = new Atomic.Identifier(location, "make-promise");
    return new Atomic.Application(location, makePromise, [delayedLambda]);
  }

  // these nodes are already in their simplest form
  visitDefineSyntax(node: Atomic.DefineSyntax) {
    return node;
  }

  visitSyntaxRules(node: Atomic.SyntaxRules) {
    return node;
  }
}
