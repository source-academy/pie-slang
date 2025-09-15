import { Token } from "../types/tokens/token";
import { Lexer } from "./lexer";
export declare class SchemeLexer implements Lexer {
    private readonly source;
    private readonly tokens;
    private start;
    private current;
    private line;
    private col;
    constructor(source: string);
    private isAtEnd;
    private advance;
    private jump;
    private addToken;
    scanTokens(): Token[];
    private scanToken;
    private comment;
    private identifierToken;
    private identifierTokenLoose;
    private identifierNumberToken;
    private checkKeyword;
    private stringToken;
    private booleanToken;
    private match;
    private peek;
    private peekNext;
    private peekPrev;
    private isDigit;
    private isSpecialSyntax;
    private isValidIdentifier;
    private isWhitespace;
}
//# sourceMappingURL=scheme-lexer.d.ts.map