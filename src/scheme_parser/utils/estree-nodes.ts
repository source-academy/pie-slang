/* Library for building ESTree nodes. */

import {
  Program,
  Expression,
  Statement,
  ExpressionStatement,
  BlockStatement,
  ArrayExpression,
  VariableDeclaration,
  CallExpression,
  ArrowFunctionExpression,
  Literal,
  Identifier,
  SourceLocation,
  ConditionalExpression,
  AssignmentExpression,
  ImportSpecifier,
  ModuleDeclaration,
  RestElement,
} from "estree";

export function makeProgram(body: Statement[] = []): Program {
  // generate a good location based on the start of the first element of the body
  // and its last, as long as the body is not empty
  const loc =
    body.length > 0
      ? {
          start: body[0].loc!.start,
          end: body[body.length - 1].loc!.end,
        }
      : {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 },
        };
  return {
    type: "Program",
    body,
    sourceType: "module",
    loc: loc,
  };
}

export function makeDeclaration(
  kind: "var" | "let" | "const",
  id: Identifier,
  init: Expression,
  loc?: SourceLocation
): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    kind,
    declarations: [
      {
        type: "VariableDeclarator",
        id,
        init,
      },
    ],
    loc: loc ? loc : id.loc,
  };
}

export function makeIdentifier(name: string, loc?: SourceLocation): Identifier {
  return {
    type: "Identifier",
    name,
    loc,
  };
}

export function makeLiteral(
  value: string | number | boolean | null | undefined,
  loc?: SourceLocation
): Literal {
  return {
    type: "Literal",
    value,
    raw: `"${value}"`,
    loc,
  } as Literal;
}

export function makeArrowFunctionExpression(
  params: (Identifier | RestElement)[],
  body: Expression | BlockStatement,
  loc?: SourceLocation
): ArrowFunctionExpression {
  return {
    type: "ArrowFunctionExpression",
    params,
    body,
    async: false,
    expression: body.type !== "BlockStatement",
    loc: loc ? loc : body.loc,
  };
}

export function makeBlockStatement(
  body: Statement[],
  loc?: SourceLocation
): BlockStatement {
  return {
    type: "BlockStatement",
    body,
    loc: loc
      ? loc
      : {
          start: body[0].loc!.start,
          end: body[body.length - 1].loc!.end,
        },
  };
}

export function makeCallExpression(
  callee: Expression,
  args: Expression[],
  loc?: SourceLocation
): CallExpression {
  return {
    type: "CallExpression",
    optional: false,
    callee,
    arguments: args,
    loc: loc
      ? loc
      : {
          start: callee.loc!.start,
          end: args[args.length - 1].loc!.end,
        },
  };
}

export function makeConditionalExpression(
  test: Expression,
  consequent: Expression,
  alternate: Expression,
  loc?: SourceLocation
): ConditionalExpression {
  return {
    type: "ConditionalExpression",
    test,
    consequent,
    alternate,
    loc: loc
      ? loc
      : {
          start: test.loc!.start,
          end: alternate.loc!.end,
        },
  };
}

export function makeAssignmentExpression(
  left: Identifier,
  right: Expression,
  loc?: SourceLocation
): AssignmentExpression {
  return {
    type: "AssignmentExpression",
    operator: "=",
    left,
    right,
    loc: loc
      ? loc
      : {
          start: left.loc!.start,
          end: right.loc!.end,
        },
  };
}

export function makeExpressionStatement(
  expression: Expression,
  loc?: SourceLocation
): ExpressionStatement {
  return {
    type: "ExpressionStatement",
    expression,
    loc: loc ? loc : expression.loc,
  };
}

export function makeReturnStatement(
  argument: Expression,
  loc?: SourceLocation
): Statement {
  return {
    type: "ReturnStatement",
    argument,
    loc: loc ? loc : argument.loc,
  };
}

export function makeRestElement(
  argument: Identifier,
  loc?: SourceLocation
): RestElement {
  return {
    type: "RestElement",
    argument,
    loc: loc ? loc : argument.loc,
  };
}

export function makeArrayExpression(
  elements: Expression[],
  loc?: SourceLocation
): ArrayExpression {
  return {
    type: "ArrayExpression",
    elements,
    loc: loc
      ? loc
      : {
          start: elements[0].loc!.start,
          end: elements[elements.length - 1].loc!.end,
        },
  };
}

export function makeImportSpecifier(
  imported: Identifier,
  local: Identifier,
  loc?: SourceLocation
): ImportSpecifier {
  return {
    type: "ImportSpecifier",
    imported,
    local,
    loc: loc ? loc : imported.loc,
  };
}

export function makeImportDeclaration(
  specifiers: ImportSpecifier[],
  source: Literal,
  loc?: SourceLocation
): ModuleDeclaration {
  return {
    type: "ImportDeclaration",
    specifiers,
    source,
    loc: loc
      ? loc
      : {
          start: specifiers[0].loc!.start,
          end: source.loc!.end,
        },
  };
}

export function makeExportNamedDeclaration(
  declaration: VariableDeclaration,
  loc?: SourceLocation
): ModuleDeclaration {
  return {
    type: "ExportNamedDeclaration",
    specifiers: [],
    source: null,
    declaration,
    loc: loc ? loc : declaration.loc,
  };
}
