import { Datum } from "./datum";
import { Group } from "./group";
import { Token } from "./token";

export { Token } from "./token";
export { TokenType } from "./token-type";
export { Group } from "./group";
export { Datum } from "./datum";

export function isToken(datum: Datum): datum is Token {
  return datum instanceof Token;
}

export function isGroup(datum: Datum): datum is Group {
  return datum instanceof Group;
}
