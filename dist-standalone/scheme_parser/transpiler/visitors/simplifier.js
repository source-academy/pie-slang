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
const scheme_node_types_1 = require("../types/nodes/scheme-node-types");
const location_1 = require("../types/location");
// a function that takes an expression and returns an array of expressions
// we will use this to "remove" the begin node whenever possible by returning its expressions
// this is useful when the begin is in a sequence, to allow its side effects to be visible
// outside the begin block
function flattenBegin(ex) {
    if (!(ex instanceof scheme_node_types_1.Extended.Begin)) {
        return [ex];
    }
    const beginExpressions = ex.expressions;
    // these expressions may themselves contain begin nodes
    // that need to be flattened
    return beginExpressions.flatMap(flattenBegin);
}
class Simplifier {
    // Factory method for creating a new Simplifier instance.
    static create() {
        return new Simplifier();
    }
    simplify(node) {
        const flattenedExpressions = node.flatMap(flattenBegin);
        return flattenedExpressions.map(expression => expression.accept(this));
    }
    // Atomic AST
    visitSequence(node) {
        const location = node.location;
        const flattenedExpressions = node.expressions.flatMap(flattenBegin);
        const newExpressions = flattenedExpressions.map(expression => expression.accept(this));
        return new scheme_node_types_1.Atomic.Sequence(location, newExpressions);
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
        const newLambda = new scheme_node_types_1.Atomic.Lambda(location, newBody, params, rest);
        return new scheme_node_types_1.Atomic.Definition(location, name, newLambda);
    }
    visitLet(node) {
        const location = node.location;
        const identifiers = node.identifiers;
        const newValues = node.values.map(value => value.accept(this));
        const newBody = node.body.accept(this);
        const newLambda = new scheme_node_types_1.Atomic.Lambda(location, newBody, identifiers);
        return new scheme_node_types_1.Atomic.Application(location, newLambda, newValues);
    }
    visitCond(node) {
        const location = node.location;
        const newPredicates = node.predicates.map(predicate => predicate.accept(this));
        const newConsequents = node.consequents.map(consequent => consequent.accept(this));
        const newCatchall = node.catchall
            ? node.catchall.accept(this)
            : node.catchall;
        if (newPredicates.length == 0) {
            // Return catchall if there is no predicate
            return new scheme_node_types_1.Atomic.Conditional(location, new scheme_node_types_1.Atomic.BooleanLiteral(location, false), new scheme_node_types_1.Atomic.Nil(location), node.catchall ? newCatchall : new scheme_node_types_1.Atomic.Nil(location));
        }
        newPredicates.reverse();
        newConsequents.reverse();
        const lastLocation = newPredicates[0].location;
        let newConditional = newCatchall
            ? newCatchall
            : new scheme_node_types_1.Atomic.Nil(lastLocation);
        for (let i = 0; i < newPredicates.length; i++) {
            const predicate = newPredicates[i];
            const consequent = newConsequents[i];
            const predLocation = predicate.location;
            const consLocation = consequent.location;
            const newLocation = new location_1.Location(predLocation.start, consLocation.end);
            newConditional = new scheme_node_types_1.Atomic.Conditional(newLocation, predicate, consequent, newConditional);
        }
        return newConditional;
    }
    // we will keep list as it is useful in its current state.
    visitList(node) {
        const location = node.location;
        const newElements = node.elements.map(element => element.accept(this));
        const newTerminator = node.terminator
            ? node.terminator.accept(this)
            : undefined;
        return new scheme_node_types_1.Extended.List(location, newElements, newTerminator);
    }
    // these begins are not located at the top level, or in sequences,
    // so they have been left alone
    // they are used as ways to sequence expressions locally instead
    visitBegin(node) {
        const location = node.location;
        const flattenedExpressions = node.expressions.flatMap(flattenBegin);
        const newExpressions = flattenedExpressions.map(expression => expression.accept(this));
        return new scheme_node_types_1.Atomic.Sequence(location, newExpressions);
    }
    // we transform delay into a call expression of "make-promise"
    visitDelay(node) {
        const location = node.location;
        const newBody = node.expression.accept(this);
        const delayedLambda = new scheme_node_types_1.Atomic.Lambda(location, newBody, []);
        const makePromise = new scheme_node_types_1.Atomic.Identifier(location, "make-promise");
        return new scheme_node_types_1.Atomic.Application(location, makePromise, [delayedLambda]);
    }
    // these nodes are already in their simplest form
    visitDefineSyntax(node) {
        return node;
    }
    visitSyntaxRules(node) {
        return node;
    }
}
exports.Simplifier = Simplifier;
//# sourceMappingURL=simplifier.js.map