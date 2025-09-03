"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemeParser = void 0;
var token_type_1 = require("../types/tokens/token-type");
var location_1 = require("../types/location");
var scheme_node_types_1 = require("../types/nodes/scheme-node-types");
var ParserError = require("./parser-error");
var group_1 = require("../types/tokens/group");
var tokens_1 = require("../types/tokens");
var constants_1 = require("../types/constants");
/**
 * An enum representing the current quoting mode of the parser.
 */
var QuoteMode;
(function (QuoteMode) {
    QuoteMode[QuoteMode["NONE"] = 0] = "NONE";
    QuoteMode[QuoteMode["QUOTE"] = 1] = "QUOTE";
    QuoteMode[QuoteMode["QUASIQUOTE"] = 2] = "QUASIQUOTE";
})(QuoteMode || (QuoteMode = {}));
var SchemeParser = /** @class */ (function () {
    function SchemeParser(source, tokens, chapter) {
        if (chapter === void 0) { chapter = Infinity; }
        this.current = 0;
        this.quoteMode = QuoteMode.NONE;
        this.source = source;
        this.tokens = tokens;
        this.chapter = chapter;
    }
    SchemeParser.prototype.advance = function () {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    };
    SchemeParser.prototype.isAtEnd = function () {
        return this.current >= this.tokens.length;
    };
    SchemeParser.prototype.previous = function () {
        return this.tokens[this.current - 1];
    };
    SchemeParser.prototype.peek = function () {
        return this.tokens[this.current];
    };
    SchemeParser.prototype.validateChapter = function (c, chapter) {
        if (this.chapter < chapter) {
            throw new ParserError.DisallowedTokenError(this.source, c.pos, c, this.chapter);
        }
    };
    /**
     * Returns the location of a token.
     * @param token A token.
     * @returns The location of the token.
     */
    SchemeParser.prototype.toLocation = function (token) {
        return new location_1.Location(token.pos, token.endPos);
    };
    /**
     * Helper function used to destructure a list into its elements and terminator.
     * An optional verifier is used if there are restrictions on the elements of the list.
     */
    SchemeParser.prototype.destructureList = function (list, verifier) {
        if (verifier === void 0) { verifier = function (_x) { }; }
        // check if the list is an empty list
        if (list.length === 0) {
            return [[], undefined];
        }
        // check if the list is a list of length 1
        if (list.length === 1) {
            verifier(list[0]);
            return [[this.parseExpression(list[0])], undefined];
        }
        // we now know that the list is at least of length 2
        // check for a dotted list
        // it is if the second last element is a dot
        var potentialDot = list.at(-2);
        if ((0, tokens_1.isToken)(potentialDot) && potentialDot.type === token_type_1.TokenType.DOT) {
            var cdrElement = list.at(-1);
            var listElements_1 = list.slice(0, -2);
            verifier(cdrElement);
            listElements_1.forEach(verifier);
            return [
                listElements_1.map(this.parseExpression.bind(this)),
                this.parseExpression(cdrElement),
            ];
        }
        // we now know that it is a proper list
        var listElements = list;
        listElements.forEach(verifier);
        return [listElements.map(this.parseExpression.bind(this)), undefined];
    };
    /**
     * Returns a group of associated tokens.
     * Tokens are grouped by level of parentheses.
     *
     * @param openparen The opening parenthesis, if one exists.
     * @returns A group of tokens or groups of tokens.
     */
    SchemeParser.prototype.grouping = function (openparen) {
        var elements = [];
        var inList = false;
        if (openparen) {
            inList = true;
            elements.push(openparen);
        }
        do {
            var c = this.advance();
            switch (c.type) {
                case token_type_1.TokenType.LEFT_PAREN:
                case token_type_1.TokenType.LEFT_BRACKET:
                    // the next group is not empty, especially because it
                    // has an open parenthesis
                    var innerGroup = this.grouping(c);
                    elements.push(innerGroup);
                    break;
                case token_type_1.TokenType.RIGHT_PAREN:
                case token_type_1.TokenType.RIGHT_BRACKET:
                    if (!inList) {
                        throw new ParserError.UnexpectedFormError(this.source, c.pos, c);
                    }
                    // add the parenthesis to the current group
                    elements.push(c);
                    inList = false;
                    break;
                case token_type_1.TokenType.APOSTROPHE: // Quoting syntax (short form)
                case token_type_1.TokenType.BACKTICK:
                case token_type_1.TokenType.COMMA:
                case token_type_1.TokenType.COMMA_AT:
                case token_type_1.TokenType.HASH_VECTOR: // Vector syntax
                    // these cases modify only the next element
                    // so we group up the next element and use this
                    // token on it
                    var nextGrouping = void 0;
                    do {
                        nextGrouping = this.grouping();
                    } while (!nextGrouping);
                    elements.push(this.affect(c, nextGrouping));
                    break;
                case token_type_1.TokenType.QUOTE: // Quoting syntax
                case token_type_1.TokenType.QUASIQUOTE:
                case token_type_1.TokenType.UNQUOTE:
                case token_type_1.TokenType.UNQUOTE_SPLICING:
                case token_type_1.TokenType.IDENTIFIER: // Atomics
                case token_type_1.TokenType.NUMBER:
                case token_type_1.TokenType.BOOLEAN:
                case token_type_1.TokenType.STRING:
                case token_type_1.TokenType.DOT:
                case token_type_1.TokenType.DEFINE: // Chapter 1
                case token_type_1.TokenType.IF:
                case token_type_1.TokenType.ELSE:
                case token_type_1.TokenType.COND:
                case token_type_1.TokenType.LAMBDA:
                case token_type_1.TokenType.LET:
                case token_type_1.TokenType.SET: // Chapter 3
                case token_type_1.TokenType.BEGIN:
                case token_type_1.TokenType.DELAY:
                case token_type_1.TokenType.IMPORT:
                case token_type_1.TokenType.EXPORT:
                case token_type_1.TokenType.DEFINE_SYNTAX:
                case token_type_1.TokenType.SYNTAX_RULES: // Chapter 4
                    elements.push(c);
                    break;
                case token_type_1.TokenType.HASH_SEMICOLON:
                    // a datum comment
                    // get the next NON-EMPTY grouping
                    // and ignore it
                    while (!this.grouping()) { }
                    break;
                case token_type_1.TokenType.EOF:
                    // We should be unable to reach this point at top level as parse()
                    // should prevent the grouping of the singular EOF token.
                    // However, with any element that ranges beyond the end of the
                    // file without its corresponding delemiter, we can reach this point.
                    throw new ParserError.UnexpectedEOFError(this.source, c.pos);
                default:
                    throw new ParserError.UnexpectedFormError(this.source, c.pos, c);
            }
        } while (inList);
        if (elements.length === 0) {
            return;
        }
        try {
            return group_1.Group.build(elements);
        }
        catch (e) {
            if (e instanceof ParserError.ExpectedFormError) {
                throw new ParserError.ExpectedFormError(this.source, e.loc, e.form, e.expected);
            }
            throw e;
        }
    };
    /**
     * Groups an affector token with its target.
     */
    SchemeParser.prototype.affect = function (affector, target) {
        return group_1.Group.build([affector, target]);
    };
    /**
     * Parse an expression.
     * @param expr A token or a group of tokens.
     * @returns
     */
    SchemeParser.prototype.parseExpression = function (expr) {
        // Discern the type of expression
        if ((0, tokens_1.isToken)(expr)) {
            return this.parseToken(expr);
        }
        // We now know it is a group
        // Due to group invariants we can determine if it represents a
        // single token instead
        if (expr.isSingleIdentifier()) {
            return this.parseToken(expr.unwrap()[0]);
        }
        return this.parseGroup(expr);
    };
    SchemeParser.prototype.parseToken = function (token) {
        switch (token.type) {
            case token_type_1.TokenType.IDENTIFIER:
                return this.quoteMode === QuoteMode.NONE
                    ? new scheme_node_types_1.Atomic.Identifier(this.toLocation(token), token.lexeme)
                    : new scheme_node_types_1.Atomic.Symbol(this.toLocation(token), token.lexeme);
            // all of these are self evaluating, and so can be left alone regardless of quote mode
            case token_type_1.TokenType.NUMBER:
                return new scheme_node_types_1.Atomic.NumericLiteral(this.toLocation(token), token.literal);
            case token_type_1.TokenType.BOOLEAN:
                return new scheme_node_types_1.Atomic.BooleanLiteral(this.toLocation(token), token.literal);
            case token_type_1.TokenType.STRING:
                return new scheme_node_types_1.Atomic.StringLiteral(this.toLocation(token), token.literal);
            default:
                // if in a quoting context, or when dealing with the macro chapter,
                // any keyword is instead treated as a symbol
                if (this.quoteMode !== QuoteMode.NONE ||
                    this.chapter >= constants_1.MACRO_CHAPTER) {
                    return new scheme_node_types_1.Atomic.Symbol(this.toLocation(token), token.lexeme);
                }
                throw new ParserError.UnexpectedFormError(this.source, token.pos, token);
        }
    };
    SchemeParser.prototype.parseGroup = function (group) {
        // No need to check if group represents a single token as well
        if (!group.isParenthesized()) {
            // The only case left is the unparenthesized case
            // of a single affector token and a target group
            // Form: <affector token> <group>
            return this.parseAffectorGroup(group);
        }
        // Now we have fallen through to the generic group
        // case - a parenthesized group of tokens.
        switch (this.quoteMode) {
            case QuoteMode.NONE:
                return this.parseNormalGroup(group);
            case QuoteMode.QUOTE:
            case QuoteMode.QUASIQUOTE:
                return this.parseQuotedGroup(group);
        }
    };
    /**
     * Parse a group of tokens affected by an affector.
     * Important case as affector changes quotation mode.
     *
     * @param group A group of tokens, verified to be an affector and a target.
     * @returns An expression.
     */
    SchemeParser.prototype.parseAffectorGroup = function (group) {
        var _a = group.unwrap(), affector = _a[0], target = _a[1];
        // Safe to cast affector due to group invariants
        switch (affector.type) {
            case token_type_1.TokenType.APOSTROPHE:
            case token_type_1.TokenType.QUOTE:
                this.validateChapter(affector, constants_1.QUOTING_CHAPTER);
                if (this.quoteMode !== QuoteMode.NONE) {
                    var innerGroup = this.parseExpression(target);
                    var newSymbol = new scheme_node_types_1.Atomic.Symbol(this.toLocation(affector), "quote");
                    var newLocation_1 = newSymbol.location.merge(innerGroup.location);
                    // wrap the entire expression in a list
                    return new scheme_node_types_1.Extended.List(newLocation_1, [newSymbol, innerGroup]);
                }
                this.quoteMode = QuoteMode.QUOTE;
                var quotedExpression = this.parseExpression(target);
                this.quoteMode = QuoteMode.NONE;
                return quotedExpression;
            case token_type_1.TokenType.BACKTICK:
            case token_type_1.TokenType.QUASIQUOTE:
                this.validateChapter(affector, constants_1.QUOTING_CHAPTER);
                if (this.quoteMode !== QuoteMode.NONE) {
                    var innerGroup = this.parseExpression(target);
                    var newSymbol = new scheme_node_types_1.Atomic.Symbol(this.toLocation(affector), "quasiquote");
                    var newLocation_2 = newSymbol.location.merge(innerGroup.location);
                    // wrap the entire expression in a list
                    return new scheme_node_types_1.Extended.List(newLocation_2, [newSymbol, innerGroup]);
                }
                this.quoteMode = QuoteMode.QUASIQUOTE;
                var quasiquotedExpression = this.parseExpression(target);
                this.quoteMode = QuoteMode.NONE;
                return quasiquotedExpression;
            case token_type_1.TokenType.COMMA:
            case token_type_1.TokenType.UNQUOTE:
                this.validateChapter(affector, constants_1.QUOTING_CHAPTER);
                var preUnquoteMode = this.quoteMode;
                if (preUnquoteMode === QuoteMode.NONE) {
                    throw new ParserError.UnsupportedTokenError(this.source, affector.pos, affector);
                }
                if (preUnquoteMode === QuoteMode.QUOTE) {
                    var innerGroup = this.parseExpression(target);
                    var newSymbol = new scheme_node_types_1.Atomic.Symbol(this.toLocation(affector), "unquote");
                    var newLocation_3 = newSymbol.location.merge(innerGroup.location);
                    // wrap the entire expression in a list
                    return new scheme_node_types_1.Extended.List(newLocation_3, [newSymbol, innerGroup]);
                }
                this.quoteMode = QuoteMode.NONE;
                var unquotedExpression = this.parseExpression(target);
                this.quoteMode = preUnquoteMode;
                return unquotedExpression;
            case token_type_1.TokenType.COMMA_AT:
            case token_type_1.TokenType.UNQUOTE_SPLICING:
                this.validateChapter(affector, constants_1.QUOTING_CHAPTER);
                var preUnquoteSplicingMode = this.quoteMode;
                if (preUnquoteSplicingMode === QuoteMode.NONE) {
                    throw new ParserError.UnexpectedFormError(this.source, affector.pos, affector);
                }
                if (preUnquoteSplicingMode === QuoteMode.QUOTE) {
                    var innerGroup = this.parseExpression(target);
                    var newSymbol = new scheme_node_types_1.Atomic.Symbol(this.toLocation(affector), "unquote-splicing");
                    var newLocation_4 = newSymbol.location.merge(innerGroup.location);
                    // wrap the entire expression in a list
                    return new scheme_node_types_1.Extended.List(newLocation_4, [newSymbol, innerGroup]);
                }
                this.quoteMode = QuoteMode.NONE;
                var unquoteSplicedExpression = this.parseExpression(target);
                this.quoteMode = preUnquoteSplicingMode;
                var newLocation = this.toLocation(affector).merge(unquoteSplicedExpression.location);
                return new scheme_node_types_1.Atomic.SpliceMarker(newLocation, unquoteSplicedExpression);
            case token_type_1.TokenType.HASH_VECTOR:
                // vectors quote over all elements inside.
                this.validateChapter(affector, constants_1.VECTOR_CHAPTER);
                var preVectorQuoteMode = this.quoteMode;
                this.quoteMode = QuoteMode.QUOTE;
                var vector = this.parseVector(group);
                this.quoteMode = preVectorQuoteMode;
                return vector;
            default:
                throw new ParserError.UnexpectedFormError(this.source, affector.pos, affector);
        }
    };
    SchemeParser.prototype.parseNormalGroup = function (group) {
        // it is an error if the group is empty in a normal context
        if (group.length() === 0) {
            if (this.chapter >= constants_1.MACRO_CHAPTER) {
                // disable any verification for the empty group
                // the CSET machine will verify its validity
                return new scheme_node_types_1.Atomic.Nil(group.location);
            }
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "non-empty group");
        }
        // get the first element
        var firstElement = group.unwrap()[0];
        // If the first element is a token, it may be a keyword or a procedure call
        if ((0, tokens_1.isToken)(firstElement)) {
            switch (firstElement.type) {
                // Scheme chapter 1
                case token_type_1.TokenType.LAMBDA:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseLambda(group);
                case token_type_1.TokenType.DEFINE:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseDefinition(group);
                case token_type_1.TokenType.IF:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseConditional(group);
                case token_type_1.TokenType.LET:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseLet(group);
                case token_type_1.TokenType.COND:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseExtendedCond(group);
                // Scheme chapter 2
                case token_type_1.TokenType.QUOTE:
                case token_type_1.TokenType.APOSTROPHE:
                case token_type_1.TokenType.QUASIQUOTE:
                case token_type_1.TokenType.BACKTICK:
                case token_type_1.TokenType.UNQUOTE:
                case token_type_1.TokenType.COMMA:
                case token_type_1.TokenType.UNQUOTE_SPLICING:
                case token_type_1.TokenType.COMMA_AT:
                    this.validateChapter(firstElement, constants_1.QUOTING_CHAPTER);
                    // we can reuse the affector group method to control the quote mode
                    return this.parseAffectorGroup(group);
                // Scheme chapter 3
                case token_type_1.TokenType.BEGIN:
                    this.validateChapter(firstElement, constants_1.MUTABLE_CHAPTER);
                    return this.parseBegin(group);
                case token_type_1.TokenType.DELAY:
                    this.validateChapter(firstElement, constants_1.MUTABLE_CHAPTER);
                    return this.parseDelay(group);
                case token_type_1.TokenType.SET:
                    this.validateChapter(firstElement, constants_1.MUTABLE_CHAPTER);
                    return this.parseSet(group);
                // Scheme full (macros)
                case token_type_1.TokenType.DEFINE_SYNTAX:
                    this.validateChapter(firstElement, constants_1.MACRO_CHAPTER);
                    return this.parseDefineSyntax(group);
                case token_type_1.TokenType.SYNTAX_RULES:
                    // should not be called outside of define-syntax!
                    throw new ParserError.UnexpectedFormError(this.source, firstElement.pos, firstElement);
                // Scm-slang misc
                case token_type_1.TokenType.IMPORT:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseImport(group);
                case token_type_1.TokenType.EXPORT:
                    this.validateChapter(firstElement, constants_1.BASIC_CHAPTER);
                    return this.parseExport(group);
                case token_type_1.TokenType.VECTOR:
                    this.validateChapter(firstElement, constants_1.VECTOR_CHAPTER);
                    // same as above, this is an affector group
                    return this.parseAffectorGroup(group);
                default:
                    // It's a procedure call
                    return this.parseApplication(group);
            }
        }
        // Form: (<group> <expr>*)
        // It's a procedure call
        return this.parseApplication(group);
    };
    /**
     * We are parsing a list/dotted list.
     */
    SchemeParser.prototype.parseQuotedGroup = function (group) {
        // check if the group is an empty list
        if (group.length() === 0) {
            return new scheme_node_types_1.Atomic.Nil(group.location);
        }
        // check if the group is a list of length 1
        if (group.length() === 1) {
            var elem = [this.parseExpression(group.unwrap()[0])];
            return new scheme_node_types_1.Extended.List(group.location, elem);
        }
        // we now know that the group is at least of length 2
        var groupElements = group.unwrap();
        var _a = this.destructureList(groupElements), listElements = _a[0], cdrElement = _a[1];
        return new scheme_node_types_1.Extended.List(group.location, listElements, cdrElement);
    };
    // _____________________CHAPTER 1_____________________
    /**
     * Parse a lambda expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseLambda = function (group) {
        var _a;
        var _this = this;
        // Form: (lambda (<identifier>*) <body>+)
        //     | (lambda (<identifier>* . <rest-identifier>) <body>+)
        // ensure that the group has at least 3 elements
        if (group.length() < 3) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(lambda (<identifier>* . <rest-identifier>?) <body>+) | (lambda <rest-identifer> <body>+)");
        }
        var elements = group.unwrap();
        var formals = elements[1];
        var body = elements.slice(2);
        // Formals should be a group of identifiers or a single identifier
        var convertedFormals = [];
        // if a rest element is detected,
        var convertedRest = undefined;
        if ((0, tokens_1.isToken)(formals)) {
            if (formals.type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.ExpectedFormError(this.source, formals.pos, formals, "<rest-identifier>");
            }
            convertedRest = new scheme_node_types_1.Atomic.Identifier(this.toLocation(formals), formals.lexeme);
        }
        else {
            // it is a group
            var formalsElements = formals.unwrap();
            _a = this.destructureList(formalsElements, 
            // pass in a verifier that checks if the elements are identifiers
            function (formal) {
                if (!(0, tokens_1.isToken)(formal)) {
                    throw new ParserError.ExpectedFormError(_this.source, formal.pos, formal, "<identifier>");
                }
                if (formal.type !== token_type_1.TokenType.IDENTIFIER) {
                    throw new ParserError.ExpectedFormError(_this.source, formal.pos, formal, "<identifier>");
                }
            }), convertedFormals = _a[0], convertedRest = _a[1];
        }
        // Body is treated as a group of expressions
        var convertedBody = body.map(this.parseExpression.bind(this));
        // assert that body is not empty
        if (convertedBody.length < 1) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(lambda ... <body>+)");
        }
        if (convertedBody.length === 1) {
            return new scheme_node_types_1.Atomic.Lambda(group.location, convertedBody[0], convertedFormals, convertedRest);
        }
        var newLocation = convertedBody
            .at(0)
            .location.merge(convertedBody.at(-1).location);
        var bodySequence = new scheme_node_types_1.Atomic.Sequence(newLocation, convertedBody);
        return new scheme_node_types_1.Atomic.Lambda(group.location, bodySequence, convertedFormals, convertedRest);
    };
    /**
     * Parse a define expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseDefinition = function (group) {
        var _a;
        var _this = this;
        // Form: (define <identifier> <expr>)
        //     | (define (<identifier> <formals>) <body>)
        //     | (define (<identifier> <formals>) <body> <body>*)
        // ensure that the group has at least 3 elements
        if (group.length() < 3) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(define <identifier> <expr>) | (define (<identifier> <formals>) <body>+)");
        }
        var elements = group.unwrap();
        var identifier = elements[1];
        var expr = elements.slice(2);
        var convertedIdentifier;
        var convertedFormals = [];
        var convertedRest = undefined;
        var isFunctionDefinition = false;
        // Identifier may be a token or a group of identifiers
        if ((0, tokens_1.isGroup)(identifier)) {
            // its a function definition
            isFunctionDefinition = true;
            var identifierElements = identifier.unwrap();
            var functionName = identifierElements[0];
            var formals = identifierElements.splice(1);
            // verify that the first element is an identifier
            if (!(0, tokens_1.isToken)(functionName)) {
                throw new ParserError.ExpectedFormError(this.source, functionName.location.start, functionName, "<identifier>");
            }
            if (functionName.type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.ExpectedFormError(this.source, functionName.pos, functionName, "<identifier>");
            }
            // convert the first element to an identifier
            convertedIdentifier = new scheme_node_types_1.Atomic.Identifier(this.toLocation(functionName), functionName.lexeme);
            // Formals should be a group of identifiers
            _a = this.destructureList(formals, function (formal) {
                if (!(0, tokens_1.isToken)(formal)) {
                    throw new ParserError.ExpectedFormError(_this.source, formal.pos, formal, "<identifier>");
                }
                if (formal.type !== token_type_1.TokenType.IDENTIFIER) {
                    throw new ParserError.ExpectedFormError(_this.source, formal.pos, formal, "<identifier>");
                }
            }), convertedFormals = _a[0], convertedRest = _a[1];
        }
        else if (identifier.type !== token_type_1.TokenType.IDENTIFIER) {
            throw new ParserError.ExpectedFormError(this.source, identifier.pos, identifier, "<identifier>");
        }
        else {
            // its a normal definition
            convertedIdentifier = new scheme_node_types_1.Atomic.Identifier(this.toLocation(identifier), identifier.lexeme);
            isFunctionDefinition = false;
        }
        // expr cannot be empty
        if (expr.length < 1) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(define ... <body>+)");
        }
        if (isFunctionDefinition) {
            // Body is treated as a group of expressions
            var convertedBody = expr.map(this.parseExpression.bind(this));
            if (convertedBody.length === 1) {
                return new scheme_node_types_1.Extended.FunctionDefinition(group.location, convertedIdentifier, convertedBody[0], convertedFormals, convertedRest);
            }
            var newLocation = convertedBody
                .at(0)
                .location.merge(convertedBody.at(-1).location);
            var bodySequence = new scheme_node_types_1.Atomic.Sequence(newLocation, convertedBody);
            return new scheme_node_types_1.Extended.FunctionDefinition(group.location, convertedIdentifier, bodySequence, convertedFormals, convertedRest);
        }
        // its a normal definition
        if (expr.length > 1) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(define <identifier> <expr>)");
        }
        // Expr is treated as a single expression
        var convertedExpr = this.parseExpression(expr[0]);
        return new scheme_node_types_1.Atomic.Definition(group.location, convertedIdentifier, convertedExpr);
    };
    /**
     * Parse a conditional expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseConditional = function (group) {
        // Form: (if <pred> <cons> <alt>)
        //     | (if <pred> <cons>)
        // ensure that the group has 3 or 4 elements
        if (group.length() < 3 || group.length() > 4) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(if <pred> <cons> <alt>?)");
        }
        var elements = group.unwrap();
        var test = elements[1];
        var consequent = elements[2];
        var alternate = group.length() > 3 ? elements[3] : undefined;
        // Test is treated as a single expression
        var convertedTest = this.parseExpression(test);
        // Consequent is treated as a single expression
        var convertedConsequent = this.parseExpression(consequent);
        // Alternate is treated as a single expression
        var convertedAlternate = alternate
            ? this.parseExpression(alternate)
            : new scheme_node_types_1.Atomic.Identifier(group.location, "undefined");
        return new scheme_node_types_1.Atomic.Conditional(group.location, convertedTest, convertedConsequent, convertedAlternate);
    };
    /**
     * Parse an application expression.
     */
    SchemeParser.prototype.parseApplication = function (group) {
        // Form: (<func> <args>*)
        // ensure that the group has at least 1 element
        if (group.length() < 1) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(<func> <args>*)");
        }
        var elements = group.unwrap();
        var operator = elements[0];
        var operands = elements.splice(1);
        // Operator is treated as a single expression
        var convertedOperator = this.parseExpression(operator);
        // Operands are treated as a group of expressions
        var convertedOperands = [];
        for (var _i = 0, operands_1 = operands; _i < operands_1.length; _i++) {
            var operand = operands_1[_i];
            convertedOperands.push(this.parseExpression(operand));
        }
        return new scheme_node_types_1.Atomic.Application(group.location, convertedOperator, convertedOperands);
    };
    /**
     * Parse a let expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseLet = function (group) {
        var _this = this;
        if (this.chapter >= constants_1.MACRO_CHAPTER) {
            // disable any verification for the let expression
            var groupItems = group.unwrap().slice(1);
            groupItems.forEach(function (item) {
                _this.parseExpression(item);
            });
            return new scheme_node_types_1.Extended.Let(group.location, [], [], new scheme_node_types_1.Atomic.Identifier(group.location, "undefined"));
        }
        // Form: (let ((<identifier> <value>)*) <body>+)
        // ensure that the group has at least 3 elements
        if (group.length() < 3) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(let ((<identifier> <value>)*) <body>+)");
        }
        var elements = group.unwrap();
        var bindings = elements[1];
        var body = elements.slice(2);
        // Verify bindings is a group
        if (!(0, tokens_1.isGroup)(bindings)) {
            throw new ParserError.ExpectedFormError(this.source, bindings.pos, bindings, "((<identifier> <value>)*)");
        }
        // Bindings are treated as a group of grouped identifiers and values
        var convertedIdentifiers = [];
        var convertedValues = [];
        var bindingElements = bindings.unwrap();
        for (var _i = 0, bindingElements_1 = bindingElements; _i < bindingElements_1.length; _i++) {
            var bindingElement = bindingElements_1[_i];
            // Verify bindingElement is a group of size 2
            if (!(0, tokens_1.isGroup)(bindingElement)) {
                throw new ParserError.ExpectedFormError(this.source, bindingElement.pos, bindingElement, "(<identifier> <value>)");
            }
            if (bindingElement.length() !== 2) {
                throw new ParserError.ExpectedFormError(this.source, bindingElement.location.start, bindingElement, "(<identifier> <value>)");
            }
            var _a = bindingElement.unwrap(), identifier = _a[0], value = _a[1];
            // Verify identifier is a token and an identifier
            if (!(0, tokens_1.isToken)(identifier)) {
                throw new ParserError.ExpectedFormError(this.source, identifier.location.start, identifier, "<identifier>");
            }
            if (identifier.type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.ExpectedFormError(this.source, identifier.pos, identifier, "<identifier>");
            }
            convertedIdentifiers.push(new scheme_node_types_1.Atomic.Identifier(this.toLocation(identifier), identifier.lexeme));
            convertedValues.push(this.parseExpression(value));
        }
        // Body is treated as a group of expressions
        var convertedBody = body.map(this.parseExpression.bind(this));
        // assert that body is not empty
        if (convertedBody.length < 1) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(let ... <body>+)");
        }
        if (convertedBody.length === 1) {
            return new scheme_node_types_1.Extended.Let(group.location, convertedIdentifiers, convertedValues, convertedBody[0]);
        }
        var newLocation = convertedBody
            .at(0)
            .location.merge(convertedBody.at(-1).location);
        var bodySequence = new scheme_node_types_1.Atomic.Sequence(newLocation, convertedBody);
        return new scheme_node_types_1.Extended.Let(group.location, convertedIdentifiers, convertedValues, bodySequence);
    };
    /**
     * Parse an extended cond expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseExtendedCond = function (group) {
        var _this = this;
        if (this.chapter >= constants_1.MACRO_CHAPTER) {
            // disable any verification for the cond expression
            var groupItems = group.unwrap().slice(1);
            groupItems.forEach(function (item) {
                _this.parseExpression(item);
            });
            return new scheme_node_types_1.Extended.Cond(group.location, [], [], new scheme_node_types_1.Atomic.Identifier(group.location, "undefined"));
        }
        // Form: (cond (<pred> <body>)*)
        //     | (cond (<pred> <body>)* (else <val>))
        // ensure that the group has at least 2 elements
        if (group.length() < 2) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(cond (<pred> <body>*)* (else <val>)?)");
        }
        var elements = group.unwrap();
        var clauses = elements.splice(1);
        // safe to cast because of the check above
        var lastClause = clauses.pop();
        // Clauses are treated as a group of groups of expressions
        // Form: (<pred> <body>*)
        var convertedClauses = [];
        var convertedConsequents = [];
        for (var _i = 0, clauses_1 = clauses; _i < clauses_1.length; _i++) {
            var clause = clauses_1[_i];
            // Verify clause is a group with size no less than 1
            if (!(0, tokens_1.isGroup)(clause)) {
                throw new ParserError.ExpectedFormError(this.source, clause.pos, clause, "(<pred> <body>*)");
            }
            if (clause.length() < 1) {
                throw new ParserError.ExpectedFormError(this.source, clause.firstToken().pos, clause.firstToken(), "(<pred> <body>*)");
            }
            var _a = clause.unwrap(), test_1 = _a[0], consequent_1 = _a.slice(1);
            // verify that test is NOT an else token
            if ((0, tokens_1.isToken)(test_1) && test_1.type === token_type_1.TokenType.ELSE) {
                throw new ParserError.ExpectedFormError(this.source, test_1.pos, test_1, "<predicate>");
            }
            // Test is treated as a single expression
            var convertedTest = this.parseExpression(test_1);
            // Consequent is treated as a group of expressions
            var consequentExpressions_1 = consequent_1.map(this.parseExpression.bind(this));
            var consequentLocation_1 = consequent_1.length < 1
                ? convertedTest.location
                : consequentExpressions_1
                    .at(0)
                    .location.merge(consequentExpressions_1.at(-1).location);
            // if consequent is empty, the test itself is treated
            // as the value returned.
            // if consequent is more than length one, there is a sequence.
            var convertedConsequent = consequent_1.length < 1
                ? convertedTest
                : consequent_1.length < 2
                    ? consequentExpressions_1[0]
                    : new scheme_node_types_1.Atomic.Sequence(consequentLocation_1, consequentExpressions_1);
            convertedClauses.push(convertedTest);
            convertedConsequents.push(convertedConsequent);
        }
        // Check last clause
        // Verify lastClause is a group with size at least 2
        if (!(0, tokens_1.isGroup)(lastClause)) {
            throw new ParserError.ExpectedFormError(this.source, lastClause.pos, lastClause, "(<pred> <body>+) | (else <val>)");
        }
        if (lastClause.length() < 2) {
            throw new ParserError.ExpectedFormError(this.source, lastClause.firstToken().pos, lastClause.firstToken(), "(<pred> <body>+) | (else <val>)");
        }
        var _b = lastClause.unwrap(), test = _b[0], consequent = _b.slice(1);
        var isElse = false;
        // verify that test is an else token
        if ((0, tokens_1.isToken)(test) && test.type === token_type_1.TokenType.ELSE) {
            isElse = true;
            // verify that consequent is of length 1
            if (consequent.length !== 1) {
                throw new ParserError.ExpectedFormError(this.source, lastClause.location.start, lastClause, "(else <val>)");
            }
        }
        // verify that consequent is at least 1 expression
        if (consequent.length < 1) {
            throw new ParserError.ExpectedFormError(this.source, lastClause.location.start, lastClause, "(<pred> <body>+)");
        }
        // Consequent is treated as a group of expressions
        var consequentExpressions = consequent.map(this.parseExpression.bind(this));
        var consequentLocation = consequentExpressions
            .at(0)
            .location.merge(consequentExpressions.at(-1).location);
        var lastConsequent = consequent.length === 1
            ? consequentExpressions[0]
            : new scheme_node_types_1.Atomic.Sequence(consequentLocation, consequentExpressions);
        if (isElse) {
            return new scheme_node_types_1.Extended.Cond(group.location, convertedClauses, convertedConsequents, lastConsequent);
        }
        // If the last clause is not an else clause, we treat it as a normal cond clause instead
        var lastTest = this.parseExpression(test);
        // Test
        convertedClauses.push(lastTest);
        convertedConsequents.push(lastConsequent);
        return new scheme_node_types_1.Extended.Cond(group.location, convertedClauses, convertedConsequents);
    };
    // _____________________CHAPTER 3_____________________
    /**
     * Parse a reassignment expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseSet = function (group) {
        // Form: (set! <identifier> <expr>)
        // ensure that the group has 3 elements
        if (group.length() !== 3) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(set! <identifier> <expr>)");
        }
        var elements = group.unwrap();
        var identifier = elements[1];
        var expr = elements[2];
        // Identifier is treated as a single identifier
        if ((0, tokens_1.isGroup)(identifier)) {
            throw new ParserError.ExpectedFormError(this.source, identifier.location.start, identifier, "<identifier>");
        }
        if (identifier.type !== token_type_1.TokenType.IDENTIFIER) {
            throw new ParserError.ExpectedFormError(this.source, identifier.pos, identifier, "<identifier>");
        }
        var convertedIdentifier = new scheme_node_types_1.Atomic.Identifier(this.toLocation(identifier), identifier.lexeme);
        var convertedExpr = this.parseExpression(expr);
        return new scheme_node_types_1.Atomic.Reassignment(group.location, convertedIdentifier, convertedExpr);
    };
    /**
     * Parse a begin expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseBegin = function (group) {
        // Form: (begin <body>+)
        // ensure that the group has 2 or more elements
        if (group.length() < 2) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(begin <body>+)");
        }
        var sequence = group.unwrap();
        var sequenceElements = sequence.slice(1);
        var convertedExpressions = [];
        for (var _i = 0, sequenceElements_1 = sequenceElements; _i < sequenceElements_1.length; _i++) {
            var sequenceElement = sequenceElements_1[_i];
            convertedExpressions.push(this.parseExpression(sequenceElement));
        }
        return new scheme_node_types_1.Extended.Begin(group.location, convertedExpressions);
    };
    /**
     * Parse a delay expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseDelay = function (group) {
        var _this = this;
        if (this.chapter >= constants_1.MACRO_CHAPTER) {
            // disable any verification for the delay expression
            var groupItems = group.unwrap().slice(1);
            groupItems.forEach(function (item) {
                _this.parseExpression(item);
            });
            return new scheme_node_types_1.Extended.Delay(group.location, new scheme_node_types_1.Atomic.Identifier(group.location, "undefined"));
        }
        // Form: (delay <expr>)
        // ensure that the group has 2 elements
        if (group.length() !== 2) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(delay <expr>)");
        }
        var elements = group.unwrap();
        var expr = elements[1];
        // Expr is treated as a single expression
        var convertedExpr = this.parseExpression(expr);
        return new scheme_node_types_1.Extended.Delay(group.location, convertedExpr);
    };
    // _____________________CHAPTER 3_____________________
    /**
     * Parse a define-syntax expression.
     * @param group
     * @returns nothing, this is for verification only.
     */
    SchemeParser.prototype.parseDefineSyntax = function (group) {
        // Form: (define-syntax <identifier> <transformer>)
        // ensure that the group has 3 elements
        if (group.length() !== 3) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(define-syntax <identifier> <transformer>)");
        }
        var elements = group.unwrap();
        var identifier = elements[1];
        var transformer = elements[2];
        // parse the identifier using quote mode
        // (to capture redefinitions of syntax)
        this.quoteMode = QuoteMode.QUOTE;
        var convertedIdentifier = this.parseExpression(identifier);
        this.quoteMode = QuoteMode.NONE;
        if (!(convertedIdentifier instanceof scheme_node_types_1.Atomic.Symbol)) {
            throw new ParserError.ExpectedFormError(this.source, convertedIdentifier.location.start, identifier, "<identifier>");
        }
        // Transformer is treated as a group
        // it should be syntax-rules
        if (!(0, tokens_1.isGroup)(transformer)) {
            throw new ParserError.ExpectedFormError(this.source, transformer.pos, transformer, "<transformer>");
        }
        if (transformer.length() < 2) {
            throw new ParserError.ExpectedFormError(this.source, transformer.firstToken().pos, transformer, "(syntax-rules ...)");
        }
        var transformerToken = transformer.unwrap()[0];
        if (!(0, tokens_1.isToken)(transformer.unwrap()[0])) {
            throw new ParserError.ExpectedFormError(this.source, transformer.firstToken().pos, transformerToken, "syntax-rules");
        }
        if (transformerToken.type !== token_type_1.TokenType.SYNTAX_RULES) {
            throw new ParserError.ExpectedFormError(this.source, transformerToken.pos, transformerToken, "syntax-rules");
        }
        // parse the transformer
        var convertedTransformer = this.parseSyntaxRules(transformer);
        return new scheme_node_types_1.Atomic.DefineSyntax(group.location, convertedIdentifier, convertedTransformer);
    };
    /**
     * Helper function to verify the validity of a pattern.
     * @param pattern
     * @returns validity of the pattern
     */
    SchemeParser.prototype.isValidPattern = function (pattern) {
        // a pattern is either a symbol, a literal or
        // a list (<pattern>+), (<pattern>+ . <pattern>), (<pattern>+ ... <pattern>*)
        // or (<pattern>+ ... <pattern>+ . <pattern>)
        if (pattern instanceof scheme_node_types_1.Extended.List) {
            // check if the list is a proper list
            var isProper = pattern.terminator === undefined;
            if (isProper) {
                // scan to make sure that only one ellipsis is present
                var ellipsisCount = pattern.elements.filter(function (item) { return item instanceof scheme_node_types_1.Atomic.Symbol && item.value === "..."; }).length;
                if (ellipsisCount > 1) {
                    return false;
                }
                var ellipsisIndex = pattern.elements.findIndex(function (item) { return item instanceof scheme_node_types_1.Atomic.Symbol && item.value === "..."; });
                if (ellipsisIndex != -1) {
                    // check if the ellipsis is behind any other element
                    // (ie it's not the first element)
                    if (ellipsisIndex === 0) {
                        return false;
                    }
                }
                // recursively check the elements
                for (var _i = 0, _a = pattern.elements; _i < _a.length; _i++) {
                    var element = _a[_i];
                    if (!this.isValidPattern(element)) {
                        return false;
                    }
                }
                return true;
            }
            else {
                // scan to make sure that only one ellipsis is present
                var ellipsisCount = pattern.elements.filter(function (item) { return item instanceof scheme_node_types_1.Atomic.Symbol && item.value === "..."; }).length;
                if (ellipsisCount > 1) {
                    return false;
                }
                var ellipsisIndex = pattern.elements.findIndex(function (item) { return item instanceof scheme_node_types_1.Atomic.Symbol && item.value === "..."; });
                if (ellipsisIndex != -1) {
                    // check if the ellipsis is behind any other element
                    // (ie it's not the first element)
                    if (ellipsisIndex === 0) {
                        return false;
                    }
                    // since this is an improper list, the ellipsis must not
                    // be the last element either
                    if (ellipsisIndex === pattern.elements.length - 1) {
                        return false;
                    }
                }
                // recursively check the elements
                for (var _b = 0, _c = pattern.elements; _b < _c.length; _b++) {
                    var element = _c[_b];
                    if (!this.isValidPattern(element)) {
                        return false;
                    }
                }
                return this.isValidPattern(pattern.terminator);
            }
        }
        else if (pattern instanceof scheme_node_types_1.Atomic.Symbol ||
            pattern instanceof scheme_node_types_1.Atomic.BooleanLiteral ||
            pattern instanceof scheme_node_types_1.Atomic.NumericLiteral ||
            pattern instanceof scheme_node_types_1.Atomic.StringLiteral ||
            pattern instanceof scheme_node_types_1.Atomic.Nil) {
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * Helper function to verify the validity of a template.
     * @param template
     * @returns validity of the template
     */
    SchemeParser.prototype.isValidTemplate = function (template) {
        // a template is either a symbol, a literal or
        // a list (<element>+), (<element>+ . <template>), (... <template>)
        // where <element> is a template optionally followed by ...
        if (template instanceof scheme_node_types_1.Extended.List) {
            // check if the list is a proper list
            var isProper = template.terminator === undefined;
            if (isProper) {
                // should have at least 1 element
                if (template.elements.length === 0) {
                    return false;
                }
                // (... <template>) case
                if (template.elements.length === 2 &&
                    template.elements[0] instanceof scheme_node_types_1.Atomic.Symbol &&
                    template.elements[0].value === "...") {
                    return this.isValidTemplate(template.elements[1]);
                }
                var ellipsisWorksOnLastElement = false;
                // check each element for validity except for ellipses.
                // for those, check if they follow a valid template.
                for (var i = 0; i < template.elements.length; i++) {
                    var element = template.elements[i];
                    if (element instanceof scheme_node_types_1.Atomic.Symbol && element.value === "...") {
                        if (ellipsisWorksOnLastElement) {
                            ellipsisWorksOnLastElement = false;
                            continue;
                        }
                        // either consecutive ellipses or the first element is an ellipsis
                        return false;
                    }
                    else {
                        if (!this.isValidTemplate(element)) {
                            return false;
                        }
                        ellipsisWorksOnLastElement = true;
                    }
                }
                return true;
            }
            else {
                if (template.elements.length === 0) {
                    return false;
                }
                var ellipsisWorksOnLastElement = false;
                // check each element for validity except for ellipses.
                // for those, check if they follow a valid template.
                for (var i = 0; i < template.elements.length; i++) {
                    var element = template.elements[i];
                    if (element instanceof scheme_node_types_1.Atomic.Symbol && element.value === "...") {
                        if (ellipsisWorksOnLastElement) {
                            ellipsisWorksOnLastElement = false;
                            continue;
                        }
                        // either consecutive ellipses or the first element is an ellipsis
                        return false;
                    }
                    else {
                        if (!this.isValidTemplate(element)) {
                            return false;
                        }
                        ellipsisWorksOnLastElement = true;
                    }
                }
                return this.isValidTemplate(template.terminator);
            }
        }
        else if (template instanceof scheme_node_types_1.Atomic.Symbol ||
            template instanceof scheme_node_types_1.Atomic.BooleanLiteral ||
            template instanceof scheme_node_types_1.Atomic.NumericLiteral ||
            template instanceof scheme_node_types_1.Atomic.StringLiteral ||
            template instanceof scheme_node_types_1.Atomic.Nil) {
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * Parse a syntax-rules expression.
     * @param group
     * @returns nothing, this is for verification only.
     */
    SchemeParser.prototype.parseSyntaxRules = function (group) {
        // syntax rules is of form
        // (syntax-rules (<literal>*) <syntax-rule>+)
        // where syntax-rule is of form
        // (<pattern> <template>)
        // ensure that the group has at least 3 elements
        if (group.length() < 3) {
            throw new ParserError.ExpectedFormError(this.source, group.location.start, group, "(syntax-rules (<literal>*) <syntax-rule>+)");
        }
        var elements = group.unwrap();
        var literals = elements[1];
        var rules = elements.slice(2);
        var finalLiterals = [];
        // verify that literals is a group
        if (!(0, tokens_1.isGroup)(literals)) {
            throw new ParserError.ExpectedFormError(this.source, literals.pos, literals, "(<literal>*)");
        }
        // parse each literal as a symbol
        this.quoteMode = QuoteMode.QUOTE;
        for (var _i = 0, _a = literals.unwrap(); _i < _a.length; _i++) {
            var literal = _a[_i];
            if (!(0, tokens_1.isToken)(literal)) {
                throw new ParserError.ExpectedFormError(this.source, literal.location.start, literal, "<literal>");
            }
            var convertedLiteral = this.parseExpression(literal);
            if (!(convertedLiteral instanceof scheme_node_types_1.Atomic.Symbol)) {
                throw new ParserError.ExpectedFormError(this.source, literal.pos, literal, "<literal>");
            }
            finalLiterals.push(convertedLiteral);
        }
        var finalRules = [];
        // each rule is a group of size 2
        for (var _b = 0, rules_1 = rules; _b < rules_1.length; _b++) {
            var rule = rules_1[_b];
            if (!(0, tokens_1.isGroup)(rule)) {
                throw new ParserError.ExpectedFormError(this.source, rule.pos, rule, "(<pattern> <template>)");
            }
            if (rule.length() !== 2) {
                throw new ParserError.ExpectedFormError(this.source, rule.location.start, rule, "(<pattern> <template>)");
            }
            // verify the validity of the pattern and template
            var _c = rule.unwrap(), pattern = _c[0], template = _c[1];
            var convertedPattern = this.parseExpression(pattern);
            var convertedTemplate = this.parseExpression(template);
            if (!this.isValidPattern(convertedPattern)) {
                throw new ParserError.ExpectedFormError(this.source, convertedPattern.location.start, pattern, "<symbol> | <literal> | (<pattern>+) | (<pattern>+ ... <pattern>*) | (<pattern>+ ... <pattern>+ . <pattern>)");
            }
            if (!this.isValidTemplate(convertedTemplate)) {
                throw new ParserError.ExpectedFormError(this.source, convertedTemplate.location.start, template, "<symbol> | <literal> | (<element>+) | (<element>+ . <template>) | (... <template>)");
            }
            finalRules.push([convertedPattern, convertedTemplate]);
        }
        this.quoteMode = QuoteMode.NONE;
        return new scheme_node_types_1.Atomic.SyntaxRules(group.location, finalLiterals, finalRules);
    };
    // ___________________MISCELLANEOUS___________________
    /**
     * Parse an import expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseImport = function (group) {
        // Form: (import "<source>" (<identifier>*))
        // ensure that the group has 3 elements
        if (group.length() !== 3) {
            throw new ParserError.ExpectedFormError(this.source, group.firstToken().pos, group.firstToken(), '(import "<source>" (<identifier>*))');
        }
        var elements = group.unwrap();
        var source = elements[1];
        var identifiers = elements[2];
        // source is treated as a single string
        if (!(0, tokens_1.isToken)(source)) {
            throw new ParserError.ExpectedFormError(this.source, source.location.start, source, '"<source>"');
        }
        if (source.type !== token_type_1.TokenType.STRING) {
            throw new ParserError.ExpectedFormError(this.source, source.pos, source, '"<source>"');
        }
        // Identifiers are treated as a group of identifiers
        if (!(0, tokens_1.isGroup)(identifiers)) {
            throw new ParserError.ExpectedFormError(this.source, identifiers.pos, identifiers, "(<identifier>*)");
        }
        var identifierElements = identifiers.unwrap();
        var convertedIdentifiers = [];
        for (var _i = 0, identifierElements_1 = identifierElements; _i < identifierElements_1.length; _i++) {
            var identifierElement = identifierElements_1[_i];
            if (!(0, tokens_1.isToken)(identifierElement)) {
                throw new ParserError.ExpectedFormError(this.source, identifierElement.location.start, identifierElement, "<identifier>");
            }
            if (identifierElement.type !== token_type_1.TokenType.IDENTIFIER) {
                throw new ParserError.ExpectedFormError(this.source, identifierElement.pos, identifierElement, "<identifier>");
            }
            convertedIdentifiers.push(new scheme_node_types_1.Atomic.Identifier(this.toLocation(identifierElement), identifierElement.lexeme));
        }
        var convertedSource = new scheme_node_types_1.Atomic.StringLiteral(this.toLocation(source), source.literal);
        return new scheme_node_types_1.Atomic.Import(group.location, convertedSource, convertedIdentifiers);
    };
    /**
     * Parse an export expression.
     * @param group
     * @returns
     */
    SchemeParser.prototype.parseExport = function (group) {
        // Form: (export (<definition>))
        // ensure that the group has 2 elements
        if (group.length() !== 2) {
            throw new ParserError.ExpectedFormError(this.source, group.firstToken().pos, group.firstToken(), "(export (<definition>))");
        }
        var elements = group.unwrap();
        var definition = elements[1];
        // assert that definition is a group
        if (!(0, tokens_1.isGroup)(definition)) {
            throw new ParserError.ExpectedFormError(this.source, definition.pos, definition, "(<definition>)");
        }
        var convertedDefinition = this.parseExpression(definition);
        // assert that convertedDefinition is a definition
        if (!(convertedDefinition instanceof scheme_node_types_1.Atomic.Definition ||
            convertedDefinition instanceof scheme_node_types_1.Extended.FunctionDefinition)) {
            throw new ParserError.ExpectedFormError(this.source, definition.location.start, definition, "(<definition>)");
        }
        return new scheme_node_types_1.Atomic.Export(group.location, convertedDefinition);
    };
    /**
     * Parses a vector expression
     */
    SchemeParser.prototype.parseVector = function (group) {
        // Because of the group invariants, we can safely assume that the group
        // is strictly of size 2.
        // Additionally, we can safely assume that the second element is a group
        // because token HASH_VECTOR expects a parenthesis as the next immediate
        // token.
        var elements = group.unwrap()[1];
        // Vectors will be treated normally regardless of the quote mode.
        // but interior expressions will be affected by the mode.
        var convertedElements = elements
            .unwrap()
            .map(this.parseExpression.bind(this));
        return new scheme_node_types_1.Atomic.Vector(group.location, convertedElements);
    };
    // ___________________________________________________
    /** Parses a sequence of tokens into an AST.
     *
     * @param group A group of tokens.
     * @returns An AST.
     */
    SchemeParser.prototype.parse = function (reparseAsSexpr) {
        if (reparseAsSexpr === void 0) { reparseAsSexpr = false; }
        if (reparseAsSexpr) {
            this.quoteMode = QuoteMode.QUOTE;
            this.current = 0;
        }
        // collect all top-level elements
        var topElements = [];
        while (!this.isAtEnd()) {
            if (this.peek().type === token_type_1.TokenType.EOF) {
                break;
            }
            var currentElement = this.grouping();
            if (!currentElement) {
                continue;
            }
            var convertedElement = this.parseExpression(currentElement);
            topElements.push(convertedElement);
        }
        // if we are in the macro chapter,
        // everything we have done so far was only to verify the program.
        // we return everything as an s-expression - that is, we quote the
        // entire program.
        if (this.chapter >= constants_1.MACRO_CHAPTER && !reparseAsSexpr) {
            // so, redo the entire parsing, but now with the quote mode on.
            // we do need to remove the imports from the top level elements,
            // and append them here.
            // assumption - all imports are top level forms. We will hoist all imports to the top.
            // TODO: Figure out how to assert imports as top level forms.
            var importElements = topElements.filter(function (e) { return e instanceof scheme_node_types_1.Atomic.Import; });
            var sexprElements = this.parse(true);
            // we remove all of the quoted imports from the sexprElements.
            // an import can be detected as a list
            // that is not empty
            // whose first element is a symbol
            // in which the name is "import".
            var restElements = sexprElements.filter(function (e) {
                return !(e instanceof scheme_node_types_1.Extended.List &&
                    e.elements &&
                    e.elements[0] instanceof scheme_node_types_1.Atomic.Symbol &&
                    e.elements[0].value === "import");
            });
            return __spreadArray(__spreadArray([], importElements, true), restElements, true);
        }
        return topElements;
    };
    return SchemeParser;
}());
exports.SchemeParser = SchemeParser;
