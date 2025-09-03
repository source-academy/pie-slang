"use strict";
/**
 * Node types of the abstract syntax tree of the Scheme Language.
 * We aim to be as simple as possible, and only represent the bare minimum
 * of Scheme syntax.
 *
 * Syntatic sugar such as "cond" or "let" will be left in another file,
 * and will be translated into the bare minimum of Scheme syntax, for now
 * with a transformer visitor, and perhaps later with a macro system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extended = exports.Atomic = void 0;
/**
 * The namespace for all the atomic node types.
 */
var Atomic;
(function (Atomic) {
    // Scheme chapter 1
    /**
     * A node that represents a sequence of expressions.
     * Also introduces a new scope.
     * The last expression is the return value of the sequence.
     */
    class Sequence {
        constructor(location, expressions) {
            this.location = location;
            this.expressions = expressions;
        }
        accept(visitor) {
            return visitor.visitSequence(this);
        }
        equals(other) {
            if (other instanceof Sequence) {
                if (this.expressions.length !== other.expressions.length) {
                    return false;
                }
                for (let i = 0; i < this.expressions.length; i++) {
                    if (!this.expressions[i].equals(other.expressions[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    }
    Atomic.Sequence = Sequence;
    /**
     * A node that represents a Scheme number.
     * TODO: Support the Scheme number tower.
     */
    class NumericLiteral {
        constructor(location, value) {
            this.location = location;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitNumericLiteral(this);
        }
        equals(other) {
            if (other instanceof NumericLiteral) {
                return this.value === other.value;
            }
            return false;
        }
    }
    Atomic.NumericLiteral = NumericLiteral;
    /**
     * A node that represents a Scheme boolean.
     */
    class BooleanLiteral {
        constructor(location, value) {
            this.location = location;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitBooleanLiteral(this);
        }
        equals(other) {
            if (other instanceof BooleanLiteral) {
                return this.value === other.value;
            }
            return false;
        }
    }
    Atomic.BooleanLiteral = BooleanLiteral;
    /**
     * A node that represents a Scheme string.
     */
    class StringLiteral {
        constructor(location, value) {
            this.location = location;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitStringLiteral(this);
        }
        equals(other) {
            if (other instanceof StringLiteral) {
                return this.value === other.value;
            }
            return false;
        }
    }
    Atomic.StringLiteral = StringLiteral;
    /**
     * A node representing a Scheme lambda expression.
     * TODO: Support rest arguments.
     */
    class Lambda {
        constructor(location, body, params, rest = undefined) {
            this.location = location;
            this.params = params;
            this.rest = rest;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitLambda(this);
        }
        equals(other) {
            if (other instanceof Lambda) {
                if (this.params.length !== other.params.length) {
                    return false;
                }
                for (let i = 0; i < this.params.length; i++) {
                    if (!this.params[i].equals(other.params[i])) {
                        return false;
                    }
                }
                if (this.rest && other.rest) {
                    if (!this.rest.equals(other.rest)) {
                        return false;
                    }
                }
                else if (this.rest || other.rest) {
                    return false;
                }
                return this.body.equals(other.body);
            }
            return false;
        }
    }
    Atomic.Lambda = Lambda;
    /**
     * A node representing a Scheme identifier.
     */
    class Identifier {
        constructor(location, name) {
            this.location = location;
            this.name = name;
        }
        accept(visitor) {
            return visitor.visitIdentifier(this);
        }
        equals(other) {
            if (other instanceof Identifier) {
                return this.name === other.name;
            }
            return false;
        }
    }
    Atomic.Identifier = Identifier;
    /**
     * A node representing a Scheme variable definition.
     * Returns nil.
     */
    class Definition {
        constructor(location, name, value) {
            this.location = location;
            this.name = name;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitDefinition(this);
        }
        equals(other) {
            if (other instanceof Definition) {
                return this.name.equals(other.name) && this.value.equals(other.value);
            }
            return false;
        }
    }
    Atomic.Definition = Definition;
    /**
     * A node representing a Scheme function application.
     */
    class Application {
        constructor(location, operator, operands) {
            this.location = location;
            this.operator = operator;
            this.operands = operands;
        }
        accept(visitor) {
            return visitor.visitApplication(this);
        }
        equals(other) {
            if (other instanceof Application) {
                if (!this.operator.equals(other.operator)) {
                    return false;
                }
                if (this.operands.length !== other.operands.length) {
                    return false;
                }
                for (let i = 0; i < this.operands.length; i++) {
                    if (!this.operands[i].equals(other.operands[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    }
    Atomic.Application = Application;
    /**
     * A node representing a Scheme conditional expression.
     */
    class Conditional {
        constructor(location, test, consequent, alternate) {
            this.location = location;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
        }
        accept(visitor) {
            return visitor.visitConditional(this);
        }
        equals(other) {
            if (other instanceof Conditional) {
                return (this.test.equals(other.test) &&
                    this.consequent.equals(other.consequent) &&
                    this.alternate.equals(other.alternate));
            }
            return false;
        }
    }
    Atomic.Conditional = Conditional;
    // Scheme chapter 2
    /**
     * A node representing a Scheme pair.
     */
    class Pair {
        constructor(location, car, cdr) {
            this.location = location;
            this.car = car;
            this.cdr = cdr;
        }
        accept(visitor) {
            return visitor.visitPair(this);
        }
        equals(other) {
            if (other instanceof Pair) {
                return this.car.equals(other.car) && this.cdr.equals(other.cdr);
            }
            return false;
        }
    }
    Atomic.Pair = Pair;
    /**
     * A node representing nil, an empty scheme list.
     */
    class Nil {
        constructor(location) {
            this.location = location;
        }
        accept(visitor) {
            return visitor.visitNil(this);
        }
        equals(other) {
            return other instanceof Nil;
        }
    }
    Atomic.Nil = Nil;
    /**
     * A node representing a Scheme symbol.
     */
    class Symbol {
        constructor(location, value) {
            this.location = location;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitSymbol(this);
        }
        equals(other) {
            if (other instanceof Symbol) {
                return this.value === other.value;
            }
            return false;
        }
    }
    Atomic.Symbol = Symbol;
    /**
     * A node representing a Scheme marker for unquote_splicing.
     * This will be evaluated at runtime.
     */
    class SpliceMarker {
        constructor(location, value) {
            this.location = location;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitSpliceMarker(this);
        }
        equals(other) {
            if (other instanceof SpliceMarker) {
                return this.value.equals(other.value);
            }
            return false;
        }
    }
    Atomic.SpliceMarker = SpliceMarker;
    // Scheme chapter 3
    /**
     * A node representing a Scheme variable reassignment.
     * Only supposed to be used on a variable that has been defined.
     * Returns nil.
     */
    class Reassignment {
        constructor(location, name, value) {
            this.location = location;
            this.name = name;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitReassignment(this);
        }
        equals(other) {
            if (other instanceof Reassignment) {
                return this.name.equals(other.name) && this.value.equals(other.value);
            }
            return false;
        }
    }
    Atomic.Reassignment = Reassignment;
    // scm-slang specific
    /**
     * A node representing an import statement.
     * syntax: (import <source> ( <identifier>* ))
     * Returns nil.
     */
    class Import {
        constructor(location, source, identifiers) {
            this.location = location;
            this.source = source;
            this.identifiers = identifiers;
        }
        accept(visitor) {
            return visitor.visitImport(this);
        }
        equals(other) {
            if (other instanceof Import) {
                if (!this.source.equals(other.source)) {
                    return false;
                }
                if (this.identifiers.length !== other.identifiers.length) {
                    return false;
                }
                for (let i = 0; i < this.identifiers.length; i++) {
                    if (!this.identifiers[i].equals(other.identifiers[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    }
    Atomic.Import = Import;
    /**
     * A node representing an export statement.
     * syntax: (export ( <definition> ))
     * Returns nil.
     */
    class Export {
        constructor(location, definition) {
            this.location = location;
            this.definition = definition;
        }
        accept(visitor) {
            return visitor.visitExport(this);
        }
        equals(other) {
            if (other instanceof Export) {
                return this.definition.equals(other.definition);
            }
            return false;
        }
    }
    Atomic.Export = Export;
    /**
     * A node representing a Scheme Vector.
     */
    class Vector {
        constructor(location, elements) {
            this.location = location;
            this.elements = elements;
        }
        accept(visitor) {
            return visitor.visitVector(this);
        }
        equals(other) {
            if (other instanceof Vector) {
                if (this.elements.length !== other.elements.length) {
                    return false;
                }
                for (let i = 0; i < this.elements.length; i++) {
                    if (!this.elements[i].equals(other.elements[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    }
    Atomic.Vector = Vector;
    /**
     * A node representing a Scheme define-syntax expression.
     */
    class DefineSyntax {
        constructor(location, name, transformer) {
            this.location = location;
            this.name = name;
            this.transformer = transformer;
        }
        accept(visitor) {
            return visitor.visitDefineSyntax(this);
        }
        equals(other) {
            if (other instanceof DefineSyntax) {
                return (this.name.equals(other.name) &&
                    this.transformer.equals(other.transformer));
            }
            return false;
        }
    }
    Atomic.DefineSyntax = DefineSyntax;
    /**
     * A node representing a Scheme syntax-rules expression.
     */
    class SyntaxRules {
        constructor(location, literals, rules) {
            this.location = location;
            this.literals = literals;
            this.rules = rules;
        }
        accept(visitor) {
            return visitor.visitSyntaxRules(this);
        }
        equals(other) {
            if (other instanceof SyntaxRules) {
                if (this.literals.length !== other.literals.length) {
                    return false;
                }
                for (let i = 0; i < this.literals.length; i++) {
                    if (!this.literals[i].equals(other.literals[i])) {
                        return false;
                    }
                }
                if (this.rules.length !== other.rules.length) {
                    return false;
                }
                for (let i = 0; i < this.rules.length; i++) {
                    if (!this.rules[i][0].equals(other.rules[i][0]) ||
                        !this.rules[i][1].equals(other.rules[i][1])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    }
    Atomic.SyntaxRules = SyntaxRules;
})(Atomic || (exports.Atomic = Atomic = {}));
/**
 * The namespace for all the syntactic sugar node types.
 * Will be transformed into the bare minimum of Scheme syntax.
 * Eventually, we won't need this namespace, as all the syntactic sugar
 * will be converted by a macro system.
 */
var Extended;
(function (Extended) {
    // Scheme chapter 1
    /**
     * A node representing a function definition.
     */
    class FunctionDefinition {
        constructor(location, name, body, params, rest = undefined) {
            this.location = location;
            this.name = name;
            this.body = body;
            this.params = params;
            this.rest = rest;
        }
        accept(visitor) {
            return visitor.visitFunctionDefinition(this);
        }
        equals(other) {
            if (other instanceof FunctionDefinition) {
                if (this.params.length !== other.params.length) {
                    return false;
                }
                for (let i = 0; i < this.params.length; i++) {
                    if (!this.params[i].equals(other.params[i])) {
                        return false;
                    }
                }
                if (this.rest && other.rest) {
                    if (!this.rest.equals(other.rest)) {
                        return false;
                    }
                }
                else if (this.rest || other.rest) {
                    return false;
                }
                return this.body.equals(other.body);
            }
            return false;
        }
    }
    Extended.FunctionDefinition = FunctionDefinition;
    /**
     * A node representing a Scheme let expression.
     */
    class Let {
        constructor(location, identifiers, values, body) {
            this.location = location;
            this.identifiers = identifiers;
            this.values = values;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitLet(this);
        }
        equals(other) {
            if (other instanceof Let) {
                if (this.identifiers.length !== other.identifiers.length) {
                    return false;
                }
                for (let i = 0; i < this.identifiers.length; i++) {
                    if (!this.identifiers[i].equals(other.identifiers[i])) {
                        return false;
                    }
                }
                if (this.values.length !== other.values.length) {
                    return false;
                }
                for (let i = 0; i < this.values.length; i++) {
                    if (!this.values[i].equals(other.values[i])) {
                        return false;
                    }
                }
                return this.body.equals(other.body);
            }
            return false;
        }
    }
    Extended.Let = Let;
    /**
     * A node representing a Scheme cond expression.
     * MAY return nil.
     */
    class Cond {
        constructor(location, predicates, consequents, catchall) {
            this.location = location;
            this.predicates = predicates;
            this.consequents = consequents;
            this.catchall = catchall;
        }
        accept(visitor) {
            return visitor.visitCond(this);
        }
        equals(other) {
            if (other instanceof Cond) {
                if (this.predicates.length !== other.predicates.length) {
                    return false;
                }
                for (let i = 0; i < this.predicates.length; i++) {
                    if (!this.predicates[i].equals(other.predicates[i])) {
                        return false;
                    }
                }
                if (this.consequents.length !== other.consequents.length) {
                    return false;
                }
                for (let i = 0; i < this.consequents.length; i++) {
                    if (!this.consequents[i].equals(other.consequents[i])) {
                        return false;
                    }
                }
                if (this.catchall && other.catchall) {
                    return this.catchall.equals(other.catchall);
                }
                else if (this.catchall || other.catchall) {
                    return false;
                }
                return true;
            }
            return false;
        }
    }
    Extended.Cond = Cond;
    // Scheme chapter 2
    /**
     * A node representing a Scheme list or dotted list.
     */
    class List {
        constructor(location, elements, terminator = undefined) {
            this.location = location;
            this.elements = elements;
            this.terminator = terminator;
        }
        accept(visitor) {
            return visitor.visitList(this);
        }
        equals(other) {
            if (other instanceof List) {
                if (this.elements.length !== other.elements.length) {
                    return false;
                }
                for (let i = 0; i < this.elements.length; i++) {
                    if (!this.elements[i].equals(other.elements[i])) {
                        return false;
                    }
                }
                if (this.terminator && other.terminator) {
                    return this.terminator.equals(other.terminator);
                }
                else if (this.terminator || other.terminator) {
                    return false;
                }
                return true;
            }
            return false;
        }
    }
    Extended.List = List;
    // Scheme chapter 3
    /**
     * A node representing a Scheme begin expression.
     * Returns the last expression.
     * syntax: (begin <expression>*)
     */
    class Begin {
        constructor(location, expressions) {
            this.location = location;
            this.expressions = expressions;
        }
        accept(visitor) {
            return visitor.visitBegin(this);
        }
        equals(other) {
            if (other instanceof Begin) {
                if (this.expressions.length !== other.expressions.length) {
                    return false;
                }
                for (let i = 0; i < this.expressions.length; i++) {
                    if (!this.expressions[i].equals(other.expressions[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    }
    Extended.Begin = Begin;
    /**
     * A node representing a Scheme delay expression.
     * Returns a promise.
     * syntax: (delay <expression>)
     */
    class Delay {
        constructor(location, expression) {
            this.location = location;
            this.expression = expression;
        }
        accept(visitor) {
            return visitor.visitDelay(this);
        }
        equals(other) {
            if (other instanceof Delay) {
                return this.expression.equals(other.expression);
            }
            return false;
        }
    }
    Extended.Delay = Delay;
})(Extended || (exports.Extended = Extended = {}));
//# sourceMappingURL=scheme-node-types.js.map