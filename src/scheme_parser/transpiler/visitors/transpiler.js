"use strict";
/**
 * The final transpiler visitor.
 * Takes in expressions, yields es.Node[], so we can flatmap into a final program
 */
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
exports.Transpiler = void 0;
var estreeBuilder = require("../../utils/estree-nodes");
// helper functions
function isExpression(node) {
    return !node.type.includes("Statement") && !node.type.includes("Declaration");
}
function wrapInRest(param) {
    return estreeBuilder.makeRestElement(param);
}
function wrapInStatement(expression) {
    return estreeBuilder.makeExpressionStatement(expression);
}
function wrapInReturn(expression) {
    return estreeBuilder.makeReturnStatement(expression);
}
var Transpiler = /** @class */ (function () {
    function Transpiler() {
    }
    Transpiler.create = function () {
        return new Transpiler();
    };
    Transpiler.prototype.transpile = function (program) {
        var _this = this;
        // create an array of expressions
        var expressions = program.flatMap(function (e) { return e.accept(_this); });
        // then create an array of statements
        var statements = expressions.map(function (e) {
            return isExpression(e) ? wrapInStatement(e) : e;
        });
        // then wrap the whole thing in a program
        return estreeBuilder.makeProgram(statements);
    };
    // Atomic AST
    // iife
    Transpiler.prototype.visitSequence = function (node) {
        var _this = this;
        var expressions = node.expressions.flatMap(function (e) { return e.accept(_this); });
        // wrap each expression into an expression statement if required
        var statements = expressions.map(function (e) {
            return isExpression(e) ? wrapInStatement(e) : e;
        });
        // promote the last expression to a return statement
        var lastExpression = statements.at(-1);
        // if the last expression is not something that emits an expression,
        // the sequence should return undefined
        if (lastExpression.type !== "ExpressionStatement") {
            statements.push(
            // always remember that undefined is an identifier
            wrapInStatement(estreeBuilder.makeIdentifier("undefined", node.location)));
        }
        else {
            // if the last expression is an expression statement, we should promote it to a return statement
            statements[statements.length - 1] = wrapInReturn(lastExpression.expression);
        }
        // turn the statements into a block
        var body = estreeBuilder.makeBlockStatement(statements);
        // make the call expression
        var iife = estreeBuilder.makeCallExpression(estreeBuilder.makeArrowFunctionExpression([], body, node.location), [], node.location);
        // if other parts of the program want to optimize their code, eliminating
        // the iife sequence, they can see that this is a sequence with this flag
        iife.isSequence = true;
        return [iife];
    };
    // literals
    Transpiler.prototype.visitNumericLiteral = function (node) {
        // we need to wrap the number in a call to make-number
        var makeNumber = estreeBuilder.makeIdentifier("make_number", node.location);
        // we turn the number into a literal
        var number = estreeBuilder.makeLiteral(node.value, node.location);
        return [
            estreeBuilder.makeCallExpression(makeNumber, [number], node.location),
        ];
    };
    Transpiler.prototype.visitBooleanLiteral = function (node) {
        return [estreeBuilder.makeLiteral(node.value, node.location)];
    };
    Transpiler.prototype.visitStringLiteral = function (node) {
        return [estreeBuilder.makeLiteral(node.value, node.location)];
    };
    Transpiler.prototype.visitLambda = function (node) {
        var _this = this;
        var parameters = node.params.flatMap(function (p) { return p.accept(_this); });
        var fnBody = node.body.accept(this)[0];
        // if the inner body is a sequence, we can optimize it by removing the sequence
        // and making the arrow function expression return the last expression
        // we left a flag in the sequence to indicate that it is an iife
        var finalBody = fnBody.isSequence
            ? // then we know that body is a sequence, stored as a call expression to an
                // inner callee with an interior arrow function expression that takes no arguments
                // let's steal that arrow function expression's body and use it as ours
                fnBody.callee.body
            : fnBody;
        if (!node.rest) {
            return [
                estreeBuilder.makeArrowFunctionExpression(parameters, finalBody, node.location),
            ];
        }
        // there is a rest parameter to deal with
        var restParameter = node.rest.accept(this)[0];
        // wrap it in a restElement
        var restElement = wrapInRest(restParameter);
        parameters.push(restElement);
        // place an implicit vector-to-list conversion around the rest parameter
        // this is to ensure that the rest parameter is always a list
        var vectorToList = estreeBuilder.makeIdentifier("vector->list", node.location);
        // we make a call to it with the rest parameter as the argument
        var restParameterConversion = estreeBuilder.makeCallExpression(vectorToList, [restParameter], node.location);
        // then we reassign the rest parameter to the result of the call
        var restParameterAssignment = estreeBuilder.makeAssignmentExpression(restParameter, restParameterConversion, node.location);
        // then we inject it into the final body
        if (finalBody.type === "BlockStatement") {
            finalBody.body.unshift(wrapInStatement(restParameterAssignment));
            return [
                estreeBuilder.makeArrowFunctionExpression(parameters, finalBody, node.location),
            ];
        }
        // otherwise, we need to wrap the final body in a block statement
        // and then inject the vectorToList call
        finalBody = estreeBuilder.makeBlockStatement([
            wrapInStatement(restParameterAssignment),
            wrapInReturn(finalBody),
        ]);
        return [
            estreeBuilder.makeArrowFunctionExpression(parameters, finalBody, node.location),
        ];
    };
    // identifiers
    Transpiler.prototype.visitIdentifier = function (node) {
        return [estreeBuilder.makeIdentifier(node.name, node.location)];
    };
    // make a verifier that prevents this from being part of an
    // expression context
    // turns into statement
    Transpiler.prototype.visitDefinition = function (node) {
        var value = node.value.accept(this)[0];
        var id = node.name.accept(this)[0];
        return [estreeBuilder.makeDeclaration("let", id, value, node.location)];
    };
    // expressions
    Transpiler.prototype.visitApplication = function (node) {
        var _this = this;
        var operator = node.operator.accept(this)[0];
        var operands = node.operands.flatMap(function (o) { return o.accept(_this); });
        return [
            estreeBuilder.makeCallExpression(operator, operands, node.location),
        ];
    };
    Transpiler.prototype.visitConditional = function (node) {
        var test = node.test.accept(this)[0];
        // scheme's truthiness is different from javascript's,
        // and so we must use a custom truthiness function truthy to evaluate the test
        var truthy = estreeBuilder.makeIdentifier("truthy", node.location);
        var schemeTest = estreeBuilder.makeCallExpression(truthy, [test], node.location);
        var consequent = node.consequent.accept(this)[0];
        var alternate = node.alternate.accept(this)[0];
        return [
            estreeBuilder.makeConditionalExpression(schemeTest, consequent, alternate, node.location),
        ];
    };
    // pair represented using cons call
    Transpiler.prototype.visitPair = function (node) {
        var car = node.car.accept(this)[0];
        var cdr = node.cdr.accept(this)[0];
        // construct the callee, cons, by hand
        var cons = estreeBuilder.makeIdentifier("cons", node.location);
        return [estreeBuilder.makeCallExpression(cons, [car, cdr], node.location)];
    };
    Transpiler.prototype.visitNil = function (node) {
        return [estreeBuilder.makeLiteral(null, node.location)];
    };
    // generate symbols with string->symbol call
    Transpiler.prototype.visitSymbol = function (node) {
        // take the string out of the symbol value
        var str = estreeBuilder.makeLiteral(node.value, node.location);
        var stringToSymbol = estreeBuilder.makeIdentifier("string->symbol", node.location);
        return [
            estreeBuilder.makeCallExpression(stringToSymbol, [str], node.location),
        ];
    };
    // we are assured that this marker will always exist within a list context.
    // leave a splice marker in the list that will be removed by a runtime
    // call to eval-splice on a list
    Transpiler.prototype.visitSpliceMarker = function (node) {
        var expr = node.value.accept(this)[0];
        var makeSplice = estreeBuilder.makeIdentifier("make-splice", node.location);
        return [estreeBuilder.makeCallExpression(makeSplice, expr, node.location)];
    };
    // turns into expression that returns assigned value
    // maybe in the future we can make a setall! macro
    Transpiler.prototype.visitReassignment = function (node) {
        var left = node.name.accept(this)[0];
        var right = node.value.accept(this)[0];
        return [estreeBuilder.makeAssignmentExpression(left, right, node.location)];
    };
    // make a verifier that keeps these top level
    // and separate from nodes
    Transpiler.prototype.visitImport = function (node) {
        var _this = this;
        // first we make the importDeclaration
        var newIdentifiers = node.identifiers.flatMap(function (i) { return i.accept(_this); });
        var mappedIdentifierNames = newIdentifiers.map(function (i) {
            var copy = Object.assign({}, i);
            copy.name = "imported" + copy.name;
            return copy;
        });
        var makeSpecifiers = function (importeds, locals) {
            return importeds.map(function (imported, i) {
                // safe to cast as we are assured all source locations are present
                return estreeBuilder.makeImportSpecifier(imported, locals[i], imported.loc);
            });
        };
        var specifiers = makeSpecifiers(newIdentifiers, mappedIdentifierNames);
        var source = node.source.accept(this)[0];
        var importDeclaration = estreeBuilder.makeImportDeclaration(specifiers, source, node.location);
        // then for each imported function, we define their proper
        // names with definitions
        var makeRedefinitions = function (importeds, locals) {
            return importeds.flatMap(function (imported, i) {
                return estreeBuilder.makeDeclaration("let", imported, locals[i], 
                // we are assured that all source locations are present
                imported.loc);
            });
        };
        var redefinitions = makeRedefinitions(newIdentifiers, mappedIdentifierNames);
        return __spreadArray([importDeclaration], redefinitions, true);
    };
    Transpiler.prototype.visitExport = function (node) {
        var newDefinition = node.definition.accept(this)[0];
        return [
            estreeBuilder.makeExportNamedDeclaration(newDefinition, node.location),
        ];
    };
    // turn into an array
    Transpiler.prototype.visitVector = function (node) {
        var _this = this;
        var newElements = node.elements.flatMap(function (e) { return e.accept(_this); });
        return [estreeBuilder.makeArrayExpression(newElements, node.location)];
    };
    // Extended AST
    // this is in the extended AST, but useful enough to keep.
    Transpiler.prototype.visitList = function (node) {
        var _this = this;
        var newElements = node.elements.flatMap(function (e) { return e.accept(_this); });
        var newTerminator = (node.terminator
            ? node.terminator.accept(this)
            : [undefined])[0];
        if (newTerminator) {
            // cons* or list* produces dotted lists
            // we prefer list* here as it explicitly describes the
            // construction of an improper list - the word LIST
            var dottedList = estreeBuilder.makeIdentifier("list*", node.location);
            return [
                estreeBuilder.makeCallExpression(dottedList, __spreadArray(__spreadArray([], newElements, true), [newTerminator], false), node.location),
            ];
        }
        // a proper list
        var list = estreeBuilder.makeIdentifier("list", node.location);
        return [estreeBuilder.makeCallExpression(list, newElements, node.location)];
    };
    // if any of these are called, its an error. the simplifier
    // should be called first.
    Transpiler.prototype.visitFunctionDefinition = function (node) {
        throw new Error("The AST should be simplified!");
    };
    Transpiler.prototype.visitLet = function (node) {
        throw new Error("The AST should be simplified!");
    };
    Transpiler.prototype.visitCond = function (node) {
        throw new Error("The AST should be simplified!");
    };
    Transpiler.prototype.visitBegin = function (node) {
        throw new Error("The AST should be simplified!");
    };
    Transpiler.prototype.visitDelay = function (node) {
        throw new Error("The AST should be simplified!");
    };
    Transpiler.prototype.visitDefineSyntax = function (node) {
        throw new Error("This should not be called!");
    };
    Transpiler.prototype.visitSyntaxRules = function (node) {
        throw new Error("This should not be called!");
    };
    return Transpiler;
}());
exports.Transpiler = Transpiler;
