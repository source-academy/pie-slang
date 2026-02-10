declare module "acorn-walk" {
  import type * as es from "estree";

  export function full(node: es.Node, callback: (node: es.Node) => void): void;
  export function simple(node: es.Node, visitors: Record<string, (node: es.Node) => void>): void;
  export function ancestor(node: es.Node, visitors: Record<string, (node: es.Node, ancestors: es.Node[]) => void>): void;
}
