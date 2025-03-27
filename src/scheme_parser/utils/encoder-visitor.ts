import * as es from "estree";
import { decode, encode } from "..";
const walk = require("acorn-walk");

// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
export function estreeEncode(ast: es.Node): es.Node {
  walk.full(ast, (node: es.Node) => {
    if ((node as any).encoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = encode(node.name);
      // ensures the conversion is only done once
      (node as any).encoded = true;
    }
  });
  walk.full(ast, (node: es.Node) => {
    (node as any).encoded = undefined;
  });
  return ast;
}

export function estreeDecode(ast: es.Node): es.Node {
  walk.full(ast, (node: es.Node) => {
    if ((node as any).decoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = decode(node.name);
      // ensures the conversion is only done once
      (node as any).decoded = true;
    }
  });
  walk.full(ast, (node: es.Node) => {
    (node as any).decoded = undefined;
  });
  return ast;
}
