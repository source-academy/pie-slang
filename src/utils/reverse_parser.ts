import * as es from "estree";

export function unparse(node: es.Node): string {
  //if ((node as any)?.hidden) return "";
  switch (node.type) {
    case "Identifier":
      return node.name;

    case "Literal":
      return node.raw!;

    case "CallExpression":
      const callee = unparse(node.callee);
      const args = node.arguments.map(unparse).join(" ");
      return `(${callee} ${args})`;

    case "ArrayExpression":
      const elements = node.elements.map(s => unparse(s as any)).join(" ");
      return `(vector ${elements})`;

    case "ArrowFunctionExpression":
      const params = node.params.map(unparse).join(" ");
      const body = unparse(node.body);
      return `(lambda (${params}) ${body})`;

    case "RestElement":
      return `. ${unparse(node.argument!)}`;

    case "BlockStatement":
      const statements = node.body.map(unparse).join(" ");
      return `(begin ${statements})`;

    case "ReturnStatement":
      const argument = unparse(node.argument!);
      return argument;

    case "VariableDeclaration":
      const id = unparse(node.declarations[0].id);
      const init = unparse(node.declarations[0].init!);
      return `(define ${id} ${init})`;

    case "ExpressionStatement":
      return unparse(node.expression);

    case "AssignmentExpression":
      const left = unparse(node.left);
      const right = unparse(node.right);
      return `(set! ${left} ${right})`;

    case "ConditionalExpression":
      const test = unparse(node.test);
      const consequent = unparse(node.consequent);
      const alternate = unparse(node.alternate);
      return `(if ${test} ${consequent} ${alternate})`;

    case "Program":
      return node.body.map(unparse).join("\n");

    case "ImportDeclaration":
      const identifiers = node.specifiers.map(unparse).join(" ");
      const source = unparse(node.source);
      return `(import (${source} ${identifiers}))`;

    case "ExportNamedDeclaration":
      const definition = unparse(node.declaration!);
      return `(export ${definition})`;

    default:
      throw new Error(`Unparsing for node type ${node.type} not implemented`);
  }
}
