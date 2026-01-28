import { Expression } from "../types/nodes/scheme-node-types";

/**
 * Interface for the Parser class
 */
export interface Parser {
  parse(): Expression[];
}
