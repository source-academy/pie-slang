"use strict";
/* Library for building ESTree nodes. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeProgram = makeProgram;
exports.makeDeclaration = makeDeclaration;
exports.makeIdentifier = makeIdentifier;
exports.makeLiteral = makeLiteral;
exports.makeArrowFunctionExpression = makeArrowFunctionExpression;
exports.makeBlockStatement = makeBlockStatement;
exports.makeCallExpression = makeCallExpression;
exports.makeConditionalExpression = makeConditionalExpression;
exports.makeAssignmentExpression = makeAssignmentExpression;
exports.makeExpressionStatement = makeExpressionStatement;
exports.makeReturnStatement = makeReturnStatement;
exports.makeRestElement = makeRestElement;
exports.makeArrayExpression = makeArrayExpression;
exports.makeImportSpecifier = makeImportSpecifier;
exports.makeImportDeclaration = makeImportDeclaration;
exports.makeExportNamedDeclaration = makeExportNamedDeclaration;
function makeProgram(body = []) {
    // generate a good location based on the start of the first element of the body
    // and its last, as long as the body is not empty
    const loc = body.length > 0
        ? {
            start: body[0].loc.start,
            end: body[body.length - 1].loc.end,
        }
        : {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 0 },
        };
    return {
        type: "Program",
        body,
        sourceType: "module",
        loc: loc,
    };
}
function makeDeclaration(kind, id, init, loc) {
    return {
        type: "VariableDeclaration",
        kind,
        declarations: [
            {
                type: "VariableDeclarator",
                id,
                init,
            },
        ],
        loc: loc ? loc : id.loc,
    };
}
function makeIdentifier(name, loc) {
    return {
        type: "Identifier",
        name,
        loc,
    };
}
function makeLiteral(value, loc) {
    return {
        type: "Literal",
        value,
        raw: `"${value}"`,
        loc,
    };
}
function makeArrowFunctionExpression(params, body, loc) {
    return {
        type: "ArrowFunctionExpression",
        params,
        body,
        async: false,
        expression: body.type !== "BlockStatement",
        loc: loc ? loc : body.loc,
    };
}
function makeBlockStatement(body, loc) {
    return {
        type: "BlockStatement",
        body,
        loc: loc
            ? loc
            : {
                start: body[0].loc.start,
                end: body[body.length - 1].loc.end,
            },
    };
}
function makeCallExpression(callee, args, loc) {
    return {
        type: "CallExpression",
        optional: false,
        callee,
        arguments: args,
        loc: loc
            ? loc
            : {
                start: callee.loc.start,
                end: args[args.length - 1].loc.end,
            },
    };
}
function makeConditionalExpression(test, consequent, alternate, loc) {
    return {
        type: "ConditionalExpression",
        test,
        consequent,
        alternate,
        loc: loc
            ? loc
            : {
                start: test.loc.start,
                end: alternate.loc.end,
            },
    };
}
function makeAssignmentExpression(left, right, loc) {
    return {
        type: "AssignmentExpression",
        operator: "=",
        left,
        right,
        loc: loc
            ? loc
            : {
                start: left.loc.start,
                end: right.loc.end,
            },
    };
}
function makeExpressionStatement(expression, loc) {
    return {
        type: "ExpressionStatement",
        expression,
        loc: loc ? loc : expression.loc,
    };
}
function makeReturnStatement(argument, loc) {
    return {
        type: "ReturnStatement",
        argument,
        loc: loc ? loc : argument.loc,
    };
}
function makeRestElement(argument, loc) {
    return {
        type: "RestElement",
        argument,
        loc: loc ? loc : argument.loc,
    };
}
function makeArrayExpression(elements, loc) {
    return {
        type: "ArrayExpression",
        elements,
        loc: loc
            ? loc
            : {
                start: elements[0].loc.start,
                end: elements[elements.length - 1].loc.end,
            },
    };
}
function makeImportSpecifier(imported, local, loc) {
    return {
        type: "ImportSpecifier",
        imported,
        local,
        loc: loc ? loc : imported.loc,
    };
}
function makeImportDeclaration(specifiers, source, loc) {
    return {
        type: "ImportDeclaration",
        specifiers,
        source,
        loc: loc
            ? loc
            : {
                start: specifiers[0].loc.start,
                end: source.loc.end,
            },
    };
}
function makeExportNamedDeclaration(declaration, loc) {
    return {
        type: "ExportNamedDeclaration",
        specifiers: [],
        source: null,
        declaration,
        loc: loc ? loc : declaration.loc,
    };
}
//# sourceMappingURL=estree-nodes.js.map