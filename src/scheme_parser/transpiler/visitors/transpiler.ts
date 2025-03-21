/**
 * The final transpiler visitor.
 * Takes in expressions, yields es.Node[], so we can flatmap into a final program
 */

import * as es from "estree";
import * as estreeBuilder from "../../utils/estree-nodes";
import {
  Atomic,
  Extended,
  Expression as scmExpression,
} from "../types/nodes/scheme-node-types";
import { Visitor } from ".";

// helper functions

function isExpression(node: es.Node): node is es.Expression {
  return !node.type.includes("Statement") && !node.type.includes("Declaration");
}

function wrapInRest(param: es.Identifier): es.RestElement {
  return estreeBuilder.makeRestElement(param);
}

function wrapInStatement(expression: es.Expression): es.ExpressionStatement {
  return estreeBuilder.makeExpressionStatement(expression);
}

function wrapInReturn(expression: es.Expression): es.ReturnStatement {
  return estreeBuilder.makeReturnStatement(expression) as es.ReturnStatement;
}

export class Transpiler implements Visitor {
  public static create(): Transpiler {
    return new Transpiler();
  }

  public transpile(program: scmExpression[]): es.Program {
    // create an array of expressions
    const expressions = program.flatMap(e => e.accept(this));

    // then create an array of statements
    const statements = expressions.map(e =>
      isExpression(e) ? wrapInStatement(e) : e
    );

    // then wrap the whole thing in a program
    return estreeBuilder.makeProgram(statements);
  }
  // Atomic AST

  // iife
  visitSequence(node: Atomic.Sequence): [es.CallExpression] {
    const expressions = node.expressions.flatMap(e => e.accept(this));

    // wrap each expression into an expression statement if required
    const statements = expressions.map(e =>
      isExpression(e) ? wrapInStatement(e) : e
    );

    // promote the last expression to a return statement
    const lastExpression: es.Statement = statements.at(-1);

    // if the last expression is not something that emits an expression,
    // the sequence should return undefined
    if (lastExpression.type !== "ExpressionStatement") {
      statements.push(
        // always remember that undefined is an identifier
        wrapInStatement(
          estreeBuilder.makeIdentifier("undefined", node.location)
        )
      );
    } else {
      // if the last expression is an expression statement, we should promote it to a return statement
      statements[statements.length - 1] = wrapInReturn(
        lastExpression.expression
      );
    }

    // turn the statements into a block
    const body = estreeBuilder.makeBlockStatement(statements);

    // make the call expression
    const iife = estreeBuilder.makeCallExpression(
      estreeBuilder.makeArrowFunctionExpression([], body, node.location),
      [],
      node.location
    );

    // if other parts of the program want to optimize their code, eliminating
    // the iife sequence, they can see that this is a sequence with this flag
    (iife as any).isSequence = true;
    return [iife];
  }

  // literals
  visitNumericLiteral(node: Atomic.NumericLiteral): [es.CallExpression] {
    // we need to wrap the number in a call to make-number
    const makeNumber = estreeBuilder.makeIdentifier(
      "make_number",
      node.location
    );
    // we turn the number into a literal
    const number = estreeBuilder.makeLiteral(node.value, node.location);
    return [
      estreeBuilder.makeCallExpression(makeNumber, [number], node.location),
    ];
  }

  visitBooleanLiteral(node: Atomic.BooleanLiteral): [es.Literal] {
    return [estreeBuilder.makeLiteral(node.value, node.location)];
  }

  visitStringLiteral(node: Atomic.StringLiteral): [es.Literal] {
    return [estreeBuilder.makeLiteral(node.value, node.location)];
  }

  visitLambda(node: Atomic.Lambda): [es.ArrowFunctionExpression] {
    const parameters: any[] = node.params.flatMap(p => p.accept(this));
    const [fnBody] = node.body.accept(this);

    // if the inner body is a sequence, we can optimize it by removing the sequence
    // and making the arrow function expression return the last expression
    // we left a flag in the sequence to indicate that it is an iife
    let finalBody = (fnBody as any).isSequence
      ? // then we know that body is a sequence, stored as a call expression to an
        // inner callee with an interior arrow function expression that takes no arguments
        // let's steal that arrow function expression's body and use it as ours
        fnBody.callee.body
      : fnBody;

    if (!node.rest) {
      return [
        estreeBuilder.makeArrowFunctionExpression(
          parameters,
          finalBody,
          node.location
        ),
      ];
    }

    // there is a rest parameter to deal with

    const [restParameter] = node.rest.accept(this);
    // wrap it in a restElement
    const restElement = wrapInRest(restParameter);
    parameters.push(restElement);

    // place an implicit vector-to-list conversion around the rest parameter
    // this is to ensure that the rest parameter is always a list
    const vectorToList = estreeBuilder.makeIdentifier(
      "vector->list",
      node.location
    );

    // we make a call to it with the rest parameter as the argument
    const restParameterConversion = estreeBuilder.makeCallExpression(
      vectorToList,
      [restParameter],
      node.location
    );

    // then we reassign the rest parameter to the result of the call
    const restParameterAssignment = estreeBuilder.makeAssignmentExpression(
      restParameter,
      restParameterConversion,
      node.location
    );

    // then we inject it into the final body
    if (finalBody.type === "BlockStatement") {
      finalBody.body.unshift(wrapInStatement(restParameterAssignment));
      return [
        estreeBuilder.makeArrowFunctionExpression(
          parameters,
          finalBody,
          node.location
        ),
      ];
    }

    // otherwise, we need to wrap the final body in a block statement
    // and then inject the vectorToList call
    finalBody = estreeBuilder.makeBlockStatement([
      wrapInStatement(restParameterAssignment),
      wrapInReturn(finalBody),
    ]);

    return [
      estreeBuilder.makeArrowFunctionExpression(
        parameters,
        finalBody,
        node.location
      ),
    ];
  }

  // identifiers
  visitIdentifier(node: Atomic.Identifier): [es.Identifier] {
    return [estreeBuilder.makeIdentifier(node.name, node.location)];
  }

  // make a verifier that prevents this from being part of an
  // expression context
  // turns into statement
  visitDefinition(node: Atomic.Definition): [es.VariableDeclaration] {
    const [value] = node.value.accept(this);
    const [id] = node.name.accept(this);
    return [estreeBuilder.makeDeclaration("let", id, value, node.location)];
  }

  // expressions
  visitApplication(node: Atomic.Application): [es.CallExpression] {
    const [operator] = node.operator.accept(this);
    const operands = node.operands.flatMap(o => o.accept(this));
    return [
      estreeBuilder.makeCallExpression(operator, operands, node.location),
    ];
  }

  visitConditional(node: Atomic.Conditional): [es.ConditionalExpression] {
    const [test] = node.test.accept(this);
    // scheme's truthiness is different from javascript's,
    // and so we must use a custom truthiness function truthy to evaluate the test
    const truthy = estreeBuilder.makeIdentifier("truthy", node.location);
    const schemeTest = estreeBuilder.makeCallExpression(
      truthy,
      [test],
      node.location
    );
    const [consequent] = node.consequent.accept(this);
    const [alternate] = node.alternate.accept(this);
    return [
      estreeBuilder.makeConditionalExpression(
        schemeTest,
        consequent,
        alternate,
        node.location
      ),
    ];
  }

  // pair represented using cons call
  visitPair(node: Atomic.Pair): [es.CallExpression] {
    const [car] = node.car.accept(this);
    const [cdr] = node.cdr.accept(this);

    // construct the callee, cons, by hand
    const cons = estreeBuilder.makeIdentifier("cons", node.location);

    return [estreeBuilder.makeCallExpression(cons, [car, cdr], node.location)];
  }
  visitNil(node: Atomic.Nil): [es.Literal] {
    return [estreeBuilder.makeLiteral(null, node.location)];
  }

  // generate symbols with string->symbol call
  visitSymbol(node: Atomic.Symbol): [es.CallExpression] {
    // take the string out of the symbol value
    const str = estreeBuilder.makeLiteral(node.value, node.location);
    const stringToSymbol = estreeBuilder.makeIdentifier(
      "string->symbol",
      node.location
    );

    return [
      estreeBuilder.makeCallExpression(stringToSymbol, [str], node.location),
    ];
  }

  // we are assured that this marker will always exist within a list context.
  // leave a splice marker in the list that will be removed by a runtime
  // call to eval-splice on a list
  visitSpliceMarker(node: Atomic.SpliceMarker): [es.CallExpression] {
    const [expr] = node.value.accept(this);

    const makeSplice = estreeBuilder.makeIdentifier(
      "make-splice",
      node.location
    );

    return [estreeBuilder.makeCallExpression(makeSplice, expr, node.location)];
  }

  // turns into expression that returns assigned value
  // maybe in the future we can make a setall! macro
  visitReassignment(node: Atomic.Reassignment): [es.AssignmentExpression] {
    const [left] = node.name.accept(this);
    const [right] = node.value.accept(this);

    return [estreeBuilder.makeAssignmentExpression(left, right, node.location)];
  }

  // make a verifier that keeps these top level
  // and separate from nodes
  visitImport(node: Atomic.Import): (es.Statement | es.ModuleDeclaration)[] {
    // first we make the importDeclaration
    const newIdentifiers = node.identifiers.flatMap(i => i.accept(this));
    const mappedIdentifierNames = newIdentifiers.map(i => {
      const copy = Object.assign({}, i);
      copy.name = "imported" + copy.name;
      return copy;
    });

    const makeSpecifiers = (
      importeds: es.Identifier[],
      locals: es.Identifier[]
    ) =>
      importeds.map((imported: es.Identifier, i: number) =>
        // safe to cast as we are assured all source locations are present
        estreeBuilder.makeImportSpecifier(
          imported,
          locals[i],
          imported.loc as es.SourceLocation
        )
      );

    const specifiers = makeSpecifiers(newIdentifiers, mappedIdentifierNames);

    const [source] = node.source.accept(this);

    const importDeclaration = estreeBuilder.makeImportDeclaration(
      specifiers,
      source,
      node.location
    );

    // then for each imported function, we define their proper
    // names with definitions

    const makeRedefinitions = (
      importeds: es.Identifier[],
      locals: es.Identifier[]
    ) =>
      importeds.flatMap((imported: es.Identifier, i: number) =>
        estreeBuilder.makeDeclaration(
          "let",
          imported,
          locals[i],
          // we are assured that all source locations are present
          imported.loc as es.SourceLocation
        )
      );

    const redefinitions = makeRedefinitions(
      newIdentifiers,
      mappedIdentifierNames
    );

    return [importDeclaration, ...redefinitions];
  }

  visitExport(node: Atomic.Export): [es.ModuleDeclaration] {
    const [newDefinition] = node.definition.accept(this);
    return [
      estreeBuilder.makeExportNamedDeclaration(newDefinition, node.location),
    ];
  }

  // turn into an array
  visitVector(node: Atomic.Vector): [es.ArrayExpression] {
    const newElements = node.elements.flatMap(e => e.accept(this));
    return [estreeBuilder.makeArrayExpression(newElements, node.location)];
  }

  // Extended AST

  // this is in the extended AST, but useful enough to keep.
  visitList(node: Extended.List): [es.CallExpression] {
    const newElements = node.elements.flatMap(e => e.accept(this));
    const [newTerminator] = node.terminator
      ? node.terminator.accept(this)
      : [undefined];
    if (newTerminator) {
      // cons* or list* produces dotted lists
      // we prefer list* here as it explicitly describes the
      // construction of an improper list - the word LIST
      const dottedList = estreeBuilder.makeIdentifier("list*", node.location);
      return [
        estreeBuilder.makeCallExpression(
          dottedList,
          [...newElements, newTerminator],
          node.location
        ),
      ];
    }

    // a proper list
    const list = estreeBuilder.makeIdentifier("list", node.location);

    return [estreeBuilder.makeCallExpression(list, newElements, node.location)];
  }

  // if any of these are called, its an error. the simplifier
  // should be called first.
  visitFunctionDefinition(
    node: Extended.FunctionDefinition
  ): [es.VariableDeclaration] {
    throw new Error("The AST should be simplified!");
  }
  visitLet(node: Extended.Let): [es.CallExpression] {
    throw new Error("The AST should be simplified!");
  }
  visitCond(node: Extended.Cond): [es.ConditionalExpression] {
    throw new Error("The AST should be simplified!");
  }
  visitBegin(node: Extended.Begin): [es.CallExpression] {
    throw new Error("The AST should be simplified!");
  }
  visitDelay(node: Extended.Delay): [es.ArrowFunctionExpression] {
    throw new Error("The AST should be simplified!");
  }
  visitDefineSyntax(node: Atomic.DefineSyntax) {
    throw new Error("This should not be called!");
  }
  visitSyntaxRules(node: Atomic.SyntaxRules) {
    throw new Error("This should not be called!");
  }
}
