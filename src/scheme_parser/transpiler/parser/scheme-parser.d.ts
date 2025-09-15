import { Token } from "../types/tokens/token";
import { Expression } from "../types/nodes/scheme-node-types";
import { Group } from "../types/tokens/group";
import { Parser } from "./parser";
export declare class SchemeParser implements Parser {
    private readonly source;
    private readonly tokens;
    private readonly chapter;
    private current;
    private quoteMode;
    constructor(source: string, tokens: Token[], chapter?: number);
    private advance;
    private isAtEnd;
    private previous;
    private peek;
    private validateChapter;
    /**
     * Returns the location of a token.
     * @param token A token.
     * @returns The location of the token.
     */
    private toLocation;
    /**
     * Helper function used to destructure a list into its elements and terminator.
     * An optional verifier is used if there are restrictions on the elements of the list.
     */
    private destructureList;
    /**
     * Returns a group of associated tokens.
     * Tokens are grouped by level of parentheses.
     *
     * @param openparen The opening parenthesis, if one exists.
     * @returns A group of tokens or groups of tokens.
     */
    private grouping;
    /**
     * Groups an affector token with its target.
     */
    private affect;
    /**
     * Parse an expression.
     * @param expr A token or a group of tokens.
     * @returns
     */
    private parseExpression;
    private parseToken;
    private parseGroup;
    /**
     * Parse a group of tokens affected by an affector.
     * Important case as affector changes quotation mode.
     *
     * @param group A group of tokens, verified to be an affector and a target.
     * @returns An expression.
     */
    parseAffectorGroup(group: Group): Expression;
    private parseNormalGroup;
    /**
     * We are parsing a list/dotted list.
     */
    private parseQuotedGroup;
    /**
     * Parse a lambda expression.
     * @param group
     * @returns
     */
    private parseLambda;
    /**
     * Parse a define expression.
     * @param group
     * @returns
     */
    private parseDefinition;
    /**
     * Parse a conditional expression.
     * @param group
     * @returns
     */
    private parseConditional;
    /**
     * Parse an application expression.
     */
    private parseApplication;
    /**
     * Parse a let expression.
     * @param group
     * @returns
     */
    private parseLet;
    /**
     * Parse an extended cond expression.
     * @param group
     * @returns
     */
    private parseExtendedCond;
    /**
     * Parse a reassignment expression.
     * @param group
     * @returns
     */
    private parseSet;
    /**
     * Parse a begin expression.
     * @param group
     * @returns
     */
    private parseBegin;
    /**
     * Parse a delay expression.
     * @param group
     * @returns
     */
    private parseDelay;
    /**
     * Parse a define-syntax expression.
     * @param group
     * @returns nothing, this is for verification only.
     */
    private parseDefineSyntax;
    /**
     * Helper function to verify the validity of a pattern.
     * @param pattern
     * @returns validity of the pattern
     */
    private isValidPattern;
    /**
     * Helper function to verify the validity of a template.
     * @param template
     * @returns validity of the template
     */
    private isValidTemplate;
    /**
     * Parse a syntax-rules expression.
     * @param group
     * @returns nothing, this is for verification only.
     */
    private parseSyntaxRules;
    /**
     * Parse an import expression.
     * @param group
     * @returns
     */
    private parseImport;
    /**
     * Parse an export expression.
     * @param group
     * @returns
     */
    private parseExport;
    /**
     * Parses a vector expression
     */
    private parseVector;
    /** Parses a sequence of tokens into an AST.
     *
     * @param group A group of tokens.
     * @returns An AST.
     */
    parse(reparseAsSexpr?: boolean): Expression[];
}
//# sourceMappingURL=scheme-parser.d.ts.map