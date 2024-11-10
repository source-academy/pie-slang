/**
 *  A datum is a token or a group of tokens.
 *  Each datum represents a single element of the syntax tree.
 */
import { Token } from "./token";
import { Group } from "./group";

export type Datum = Token | Group;
