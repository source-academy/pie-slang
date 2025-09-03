"use strict";
/**
 * A visitor that evaluates all definitions in a Scheme AST.
 * If several redefinitions are made, they are converted to reassignments.
 * Required to play nice with JavaScript's scoping rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redefiner = void 0;
var scheme_node_types_1 = require("../types/nodes/scheme-node-types");
var Redefiner = /** @class */ (function () {
    function Redefiner() {
    }
    // Factory method for creating a new Redefiner instance.
    Redefiner.create = function () {
        return new Redefiner();
    };
    Redefiner.prototype.redefineScope = function (scope) {
        var names = new Set();
        var newScope = scope.map(function (expression) {
            if (expression instanceof scheme_node_types_1.Atomic.Definition) {
                var exprName = expression.name.name;
                if (names.has(exprName)) {
                    return new scheme_node_types_1.Atomic.Reassignment(expression.location, expression.name, expression.value);
                }
                names.add(exprName);
            }
            return expression;
        });
        return newScope;
    };
    Redefiner.prototype.redefine = function (nodes) {
        var _this = this;
        // recursivly redefine the scope of the nodes
        // then work directly on the new nodes
        var newNodes = nodes.map(function (node) { return node.accept(_this); });
        return this.redefineScope(newNodes);
    };
    // Atomic AST
    Redefiner.prototype.visitSequence = function (node) {
        var _this = this;
        var location = node.location;
        var newExpressions = node.expressions.map(function (expression) {
            return expression.accept(_this);
        });
        return new scheme_node_types_1.Atomic.Sequence(location, this.redefineScope(newExpressions));
    };
    Redefiner.prototype.visitNumericLiteral = function (node) {
        return node;
    };
    Redefiner.prototype.visitBooleanLiteral = function (node) {
        return node;
    };
    Redefiner.prototype.visitStringLiteral = function (node) {
        return node;
    };
    Redefiner.prototype.visitLambda = function (node) {
        var location = node.location;
        var params = node.params;
        var rest = node.rest;
        var newBody = node.body.accept(this);
        return new scheme_node_types_1.Atomic.Lambda(location, newBody, params, rest);
    };
    Redefiner.prototype.visitIdentifier = function (node) {
        return node;
    };
    Redefiner.prototype.visitDefinition = function (node) {
        var location = node.location;
        var name = node.name;
        var newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.Definition(location, name, newValue);
    };
    Redefiner.prototype.visitApplication = function (node) {
        var _this = this;
        var location = node.location;
        var newOperator = node.operator.accept(this);
        var newOperands = node.operands.map(function (operand) { return operand.accept(_this); });
        return new scheme_node_types_1.Atomic.Application(location, newOperator, newOperands);
    };
    Redefiner.prototype.visitConditional = function (node) {
        var location = node.location;
        var newTest = node.test.accept(this);
        var newConsequent = node.consequent.accept(this);
        var newAlternate = node.alternate.accept(this);
        return new scheme_node_types_1.Atomic.Conditional(location, newTest, newConsequent, newAlternate);
    };
    Redefiner.prototype.visitPair = function (node) {
        var location = node.location;
        var newCar = node.car.accept(this);
        var newCdr = node.cdr.accept(this);
        return new scheme_node_types_1.Atomic.Pair(location, newCar, newCdr);
    };
    Redefiner.prototype.visitNil = function (node) {
        return node;
    };
    Redefiner.prototype.visitSymbol = function (node) {
        return node;
    };
    Redefiner.prototype.visitSpliceMarker = function (node) {
        var location = node.location;
        var newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.SpliceMarker(location, newValue);
    };
    Redefiner.prototype.visitReassignment = function (node) {
        var location = node.location;
        var name = node.name;
        var newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.Reassignment(location, name, newValue);
    };
    // Already in simplest form.
    Redefiner.prototype.visitImport = function (node) {
        return node;
    };
    Redefiner.prototype.visitExport = function (node) {
        var location = node.location;
        var newDefinition = node.definition.accept(this);
        return new scheme_node_types_1.Atomic.Export(location, newDefinition);
    };
    Redefiner.prototype.visitVector = function (node) {
        var _this = this;
        var location = node.location;
        // Simplify the elements of the vector
        var newElements = node.elements.map(function (element) { return element.accept(_this); });
        return new scheme_node_types_1.Atomic.Vector(location, newElements);
    };
    // Extended AST
    Redefiner.prototype.visitFunctionDefinition = function (node) {
        var location = node.location;
        var name = node.name;
        var params = node.params;
        var rest = node.rest;
        var newBody = node.body.accept(this);
        return new scheme_node_types_1.Extended.FunctionDefinition(location, name, newBody, params, rest);
    };
    Redefiner.prototype.visitLet = function (node) {
        var _this = this;
        var location = node.location;
        var identifiers = node.identifiers;
        var newValues = node.values.map(function (value) { return value.accept(_this); });
        var newBody = node.body.accept(this);
        return new scheme_node_types_1.Extended.Let(location, identifiers, newValues, newBody);
    };
    Redefiner.prototype.visitCond = function (node) {
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
        return new scheme_node_types_1.Extended.Cond(location, newPredicates, newConsequents, newCatchall);
    };
    Redefiner.prototype.visitList = function (node) {
        var _this = this;
        var location = node.location;
        var newElements = node.elements.map(function (element) { return element.accept(_this); });
        var newTerminator = node.terminator
            ? node.terminator.accept(this)
            : undefined;
        return new scheme_node_types_1.Extended.List(location, newElements, newTerminator);
    };
    Redefiner.prototype.visitBegin = function (node) {
        var _this = this;
        var location = node.location;
        var newExpressions = node.expressions.map(function (expression) {
            return expression.accept(_this);
        });
        return new scheme_node_types_1.Extended.Begin(location, this.redefineScope(newExpressions));
    };
    Redefiner.prototype.visitDelay = function (node) {
        var location = node.location;
        var newBody = node.expression.accept(this);
        return new scheme_node_types_1.Extended.Delay(location, newBody);
    };
    // there are no redefinitions in the following nodes.
    Redefiner.prototype.visitDefineSyntax = function (node) {
        return node;
    };
    Redefiner.prototype.visitSyntaxRules = function (node) {
        return node;
    };
    return Redefiner;
}());
exports.Redefiner = Redefiner;
