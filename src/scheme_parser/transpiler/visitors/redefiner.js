"use strict";
/**
 * A visitor that evaluates all definitions in a Scheme AST.
 * If several redefinitions are made, they are converted to reassignments.
 * Required to play nice with JavaScript's scoping rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redefiner = void 0;
const scheme_node_types_1 = require("../types/nodes/scheme-node-types");
class Redefiner {
    // Factory method for creating a new Redefiner instance.
    static create() {
        return new Redefiner();
    }
    redefineScope(scope) {
        const names = new Set();
        const newScope = scope.map(expression => {
            if (expression instanceof scheme_node_types_1.Atomic.Definition) {
                const exprName = expression.name.name;
                if (names.has(exprName)) {
                    return new scheme_node_types_1.Atomic.Reassignment(expression.location, expression.name, expression.value);
                }
                names.add(exprName);
            }
            return expression;
        });
        return newScope;
    }
    redefine(nodes) {
        // recursivly redefine the scope of the nodes
        // then work directly on the new nodes
        const newNodes = nodes.map(node => node.accept(this));
        return this.redefineScope(newNodes);
    }
    // Atomic AST
    visitSequence(node) {
        const location = node.location;
        const newExpressions = node.expressions.map(expression => expression.accept(this));
        return new scheme_node_types_1.Atomic.Sequence(location, this.redefineScope(newExpressions));
    }
    visitNumericLiteral(node) {
        return node;
    }
    visitBooleanLiteral(node) {
        return node;
    }
    visitStringLiteral(node) {
        return node;
    }
    visitLambda(node) {
        const location = node.location;
        const params = node.params;
        const rest = node.rest;
        const newBody = node.body.accept(this);
        return new scheme_node_types_1.Atomic.Lambda(location, newBody, params, rest);
    }
    visitIdentifier(node) {
        return node;
    }
    visitDefinition(node) {
        const location = node.location;
        const name = node.name;
        const newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.Definition(location, name, newValue);
    }
    visitApplication(node) {
        const location = node.location;
        const newOperator = node.operator.accept(this);
        const newOperands = node.operands.map(operand => operand.accept(this));
        return new scheme_node_types_1.Atomic.Application(location, newOperator, newOperands);
    }
    visitConditional(node) {
        const location = node.location;
        const newTest = node.test.accept(this);
        const newConsequent = node.consequent.accept(this);
        const newAlternate = node.alternate.accept(this);
        return new scheme_node_types_1.Atomic.Conditional(location, newTest, newConsequent, newAlternate);
    }
    visitPair(node) {
        const location = node.location;
        const newCar = node.car.accept(this);
        const newCdr = node.cdr.accept(this);
        return new scheme_node_types_1.Atomic.Pair(location, newCar, newCdr);
    }
    visitNil(node) {
        return node;
    }
    visitSymbol(node) {
        return node;
    }
    visitSpliceMarker(node) {
        const location = node.location;
        const newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.SpliceMarker(location, newValue);
    }
    visitReassignment(node) {
        const location = node.location;
        const name = node.name;
        const newValue = node.value.accept(this);
        return new scheme_node_types_1.Atomic.Reassignment(location, name, newValue);
    }
    // Already in simplest form.
    visitImport(node) {
        return node;
    }
    visitExport(node) {
        const location = node.location;
        const newDefinition = node.definition.accept(this);
        return new scheme_node_types_1.Atomic.Export(location, newDefinition);
    }
    visitVector(node) {
        const location = node.location;
        // Simplify the elements of the vector
        const newElements = node.elements.map(element => element.accept(this));
        return new scheme_node_types_1.Atomic.Vector(location, newElements);
    }
    // Extended AST
    visitFunctionDefinition(node) {
        const location = node.location;
        const name = node.name;
        const params = node.params;
        const rest = node.rest;
        const newBody = node.body.accept(this);
        return new scheme_node_types_1.Extended.FunctionDefinition(location, name, newBody, params, rest);
    }
    visitLet(node) {
        const location = node.location;
        const identifiers = node.identifiers;
        const newValues = node.values.map(value => value.accept(this));
        const newBody = node.body.accept(this);
        return new scheme_node_types_1.Extended.Let(location, identifiers, newValues, newBody);
    }
    visitCond(node) {
        const location = node.location;
        const newPredicates = node.predicates.map(predicate => predicate.accept(this));
        const newConsequents = node.consequents.map(consequent => consequent.accept(this));
        const newCatchall = node.catchall
            ? node.catchall.accept(this)
            : node.catchall;
        return new scheme_node_types_1.Extended.Cond(location, newPredicates, newConsequents, newCatchall);
    }
    visitList(node) {
        const location = node.location;
        const newElements = node.elements.map(element => element.accept(this));
        const newTerminator = node.terminator
            ? node.terminator.accept(this)
            : undefined;
        return new scheme_node_types_1.Extended.List(location, newElements, newTerminator);
    }
    visitBegin(node) {
        const location = node.location;
        const newExpressions = node.expressions.map(expression => expression.accept(this));
        return new scheme_node_types_1.Extended.Begin(location, this.redefineScope(newExpressions));
    }
    visitDelay(node) {
        const location = node.location;
        const newBody = node.expression.accept(this);
        return new scheme_node_types_1.Extended.Delay(location, newBody);
    }
    // there are no redefinitions in the following nodes.
    visitDefineSyntax(node) {
        return node;
    }
    visitSyntaxRules(node) {
        return node;
    }
}
exports.Redefiner = Redefiner;
//# sourceMappingURL=redefiner.js.map