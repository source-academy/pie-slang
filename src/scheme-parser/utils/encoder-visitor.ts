import * as es from "estree";
import { decode, encode } from "./identifier-encoding";
import * as acornWalk from "acorn-walk";

// full() walks ESTree structure; unlike Acorn's types, these ASTs need not
// carry Acorn-specific start/end offsets. The walker does not read them.
const walk = acornWalk as unknown as {
  full(ast: es.Node, callback: (node: es.Node) => void): void;
};

// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
export function estreeEncode(ast: es.Node): es.Node {
  walk.full(ast, (node: es.Node) => {
    if ((node as es.Node & { encoded?: boolean }).encoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = encode(node.name);
      // ensures the conversion is only done once
      (node as es.Node & { encoded?: boolean }).encoded = true;
    }
  });
  walk.full(ast, (node: es.Node) => {
    (node as es.Node & { encoded?: boolean }).encoded = undefined;
  });
  return ast;
}

export function estreeDecode(ast: es.Node): es.Node {
  walk.full(ast, (node: es.Node) => {
    if ((node as es.Node & { decoded?: boolean }).decoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = decode(node.name);
      // ensures the conversion is only done once
      (node as es.Node & { decoded?: boolean }).decoded = true;
    }
  });
  walk.full(ast, (node: es.Node) => {
    (node as es.Node & { decoded?: boolean }).decoded = undefined;
  });
  return ast;
}
