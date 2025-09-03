"use strict";
/**
 * A visitor that transforms all "extended AST" nodes into "atomic AST" nodes.
 * Except for everything inside a quote, which is left alone.
 *
 * It also does double work by "flattening" begin nodes whenever possible, to allow definitions
 * to be visible outside the begin structure (since begins don't have their own scope).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simplifier = void 0;
var scheme_node_types_1 = require("../types/nodes/scheme-node-types");
var location_1 = require("../types/location");
// a function that takes an expression and returns an array of expressions
// we will use this to "remove" the begin node whenever possible by returning its expressions
// this is useful when the begin is in a sequence, to allow its side effects to be visible
// outside the begin block
function flattenBegin(ex) {
    if (!(ex instanceof scheme_node_types_1.Extended.Begin)) {
        return [ex];
    }
    var beginExpressions = ex.expressions;
    // these expressions may themselves contain begin nodes
    // that need to be flattened
    return beginExpressions.flatMap(flattenBegin);
}
var Simplifier = /** @class */ (function () {
    function Simplifier() {
    }
    // Factory method for creating a new Simplifier instance.
    Simplifier.create = function () {
        return new Simplifier();
    };
    Simplifier.prototype.simplify = function (node) {
        var _this = this;
        var flattenedExpressions = node.flatMap(flattenBegin);
        return flattenedExpressions.map(function (expression) { return expression.accept(_this); });
    };
    // Atomic AST
    Simplifier.prototype.visitSequence = function (node) {
        var _this = this;
        var location = node.location;
        var flattenedExpressions = node.expressions.flatMap(flattenBegin);
        var newExpressions = flattenedExpressions.map(function (expression) {
            return expression.accept(_this);
        });
        return new scheme_node_types_1.Atomic.Sequence(location, newExpressions);
    };
    Simplifier.prototype.visitNumericLiteral = function (node) {
        return node;
    };
    Simplifier.prototype.visitBooleanLiteral = function (node) {
        return node;
    };
    Simplifier.prototype.visitStringLiteral = function (node) {
        return node;
    };
    Simplifier.prototype.visitLambda = function (node) {
        var location = node.location;
        var params = node.params;
        var rest = node.rest;
        var newBody = node.body.accept(this);
        return new scheme_node_types_1.Atomic.Lambda(location, newBody, params, rest);
    };
    Simplifier.prototype.visitIdentifier = function (node) {
        return node;
    };
    Simplifier.prototype.visitDefinition = function (node) {
        var location = node.location;
        var name = node.name;
        var newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.Definition(location, name, newValue);
    };
    Simplifier.prototype.visitApplication = function (node) {
        var _this = this;
        var location = node.location;
        var newOperator = node.operator.accept(this);
        var newOperands = node.operands.map(function (operand) { return operand.accept(_this); });
        return new scheme_node_types_1.Atomic.Application(location, newOperator, newOperands);
    };
    Simplifier.prototype.visitConditional = function (node) {
        var location = node.location;
        var newTest = node.test.accept(this);
        var newConsequent = node.consequent.accept(this);
        var newAlternate = node.alternate.accept(this);
        return new scheme_node_types_1.Atomic.Conditional(location, newTest, newConsequent, newAlternate);
    };
    Simplifier.prototype.visitPair = function (node) {
        var location = node.location;
        var newCar = node.car.accept(this);
        var newCdr = node.cdr.accept(this);
        return new scheme_node_types_1.Atomic.Pair(location, newCar, newCdr);
    };
    Simplifier.prototype.visitNil = function (node) {
        return node;
    };
    Simplifier.prototype.visitSymbol = function (node) {
        return node;
    };
    Simplifier.prototype.visitSpliceMarker = function (node) {
        var location = node.location;
        var newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.SpliceMarker(location, newValue);
    };
    Simplifier.prototype.visitReassignment = function (node) {
        var location = node.location;
        var name = node.name;
        var newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.Reassignment(location, name, newValue);
    };
    // Already in simplest form.
    Simplifier.prototype.visitImport = function (node) {
        return node;
    };
    Simplifier.prototype.visitExport = function (node) {
        var location = node.location;
        var newDefinition = node.definition.accept(this);
        return new scheme_node_types_1.Atomic.Export(location, newDefinition);
    };
    Simplifier.prototype.visitVector = function (node) {
        var _this = this;
        var location = node.location;
        // Simplify the elements of the vector
        var newElements = node.elements.map(function (element) { return element.accept(_this); });
        return new scheme_node_types_1.Atomic.Vector(location, newElements);
    };
    // Extended AST
    Simplifier.prototype.visitFunctionDefinition = function (node) {
        var location = node.location;
        var name = node.name;
        var params = node.params;
        var rest = node.rest;
        var newBody = node.body.accept(this);
        var newLambda = new scheme_node_types_1.Atomic.Lambda(location, newBody, params, rest);
        return new scheme_node_types_1.Atomic.Definition(location, name, newLambda);
    };
    Simplifier.prototype.visitLet = function (node) {
        var _this = this;
        var location = node.location;
        var identifiers = node.identifiers;
        var newValues = node.values.map(function (value) { return value.accept(_this); });
        var newBody = node.body.accept(this);
        var newLambda = new scheme_node_types_1.Atomic.Lambda(location, newBody, identifiers);
        return new scheme_node_types_1.Atomic.Application(location, newLambda, newValues);
    };
    Simplifier.prototype.visitCond = function (node) {
        var _this = this;
        var location = node.location;
        var newPredicates = node.predicates.map(function (predicate) {
            return predicate.accept(_this);
        });
        var newConsequents = node.consequents.map(function (consequent) {
            return consequent.accept(_this);
        });
        var newCatchall = node.catchall
            ? node.catchall.accept(this)
            : node.catchall;
        if (newPredicates.length == 0) {
            // Return catchall if there is no predicate
            return new scheme_node_types_1.Atomic.Conditional(location, new scheme_node_types_1.Atomic.BooleanLiteral(location, false), new scheme_node_types_1.Atomic.Nil(location), node.catchall ? newCatchall : new scheme_node_types_1.Atomic.Nil(location));
        }
        newPredicates.reverse();
        newConsequents.reverse();
        var lastLocation = newPredicates[0].location;
        var newConditional = newCatchall
            ? newCatchall
            : new scheme_node_types_1.Atomic.Nil(lastLocation);
        for (var i = 0; i < newPredicates.length; i++) {
            var predicate = newPredicates[i];
            var consequent = newConsequents[i];
            var predLocation = predicate.location;
            var consLocation = consequent.location;
            var newLocation = new location_1.Location(predLocation.start, consLocation.end);
            newConditional = new scheme_node_types_1.Atomic.Conditional(newLocation, predicate, consequent, newConditional);
        }
        return newConditional;
    };
    // we will keep list as it is useful in its current state.
    Simplifier.prototype.visitList = function (node) {
        var _this = this;
        var location = node.location;
        var newElements = node.elements.map(function (element) { return element.accept(_this); });
        var newTerminator = node.terminator
            ? node.terminator.accept(this)
            : undefined;
        return new scheme_node_types_1.Extended.List(location, newElements, newTerminator);
    };
    // these begins are not located at the top level, or in sequences,
    // so they have been left alone
    // they are used as ways to sequence expressions locally instead
    Simplifier.prototype.visitBegin = function (node) {
        var _this = this;
        var location = node.location;
        var flattenedExpressions = node.expressions.flatMap(flattenBegin);
        var newExpressions = flattenedExpressions.map(function (expression) {
            return expression.accept(_this);
        });
        return new scheme_node_types_1.Atomic.Sequence(location, newExpressions);
    };
    // we transform delay into a call expression of "make-promise"
    Simplifier.prototype.visitDelay = function (node) {
        var location = node.location;
        var newBody = node.expression.accept(this);
        var delayedLambda = new scheme_node_types_1.Atomic.Lambda(location, newBody, []);
        var makePromise = new scheme_node_types_1.Atomic.Identifier(location, "make-promise");
        return new scheme_node_types_1.Atomic.Application(location, makePromise, [delayedLambda]);
    };
    // these nodes are already in their simplest form
    Simplifier.prototype.visitDefineSyntax = function (node) {
        return node;
    };
    Simplifier.prototype.visitSyntaxRules = function (node) {
        return node;
    };
    return Simplifier;
}());
exports.Simplifier = Simplifier;
