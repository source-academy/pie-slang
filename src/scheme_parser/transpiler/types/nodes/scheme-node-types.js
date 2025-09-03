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
    var Sequence = /** @class */ (function () {
        function Sequence(location, expressions) {
            this.location = location;
            this.expressions = expressions;
        }
        Sequence.prototype.accept = function (visitor) {
            return visitor.visitSequence(this);
        };
        Sequence.prototype.equals = function (other) {
            if (other instanceof Sequence) {
                if (this.expressions.length !== other.expressions.length) {
                    return false;
                }
                for (var i = 0; i < this.expressions.length; i++) {
                    if (!this.expressions[i].equals(other.expressions[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };
        return Sequence;
    }());
    Atomic.Sequence = Sequence;
    /**
     * A node that represents a Scheme number.
     * TODO: Support the Scheme number tower.
     */
    var NumericLiteral = /** @class */ (function () {
        function NumericLiteral(location, value) {
            this.location = location;
            this.value = value;
        }
        NumericLiteral.prototype.accept = function (visitor) {
            return visitor.visitNumericLiteral(this);
        };
        NumericLiteral.prototype.equals = function (other) {
            if (other instanceof NumericLiteral) {
                return this.value === other.value;
            }
            return false;
        };
        return NumericLiteral;
    }());
    Atomic.NumericLiteral = NumericLiteral;
    /**
     * A node that represents a Scheme boolean.
     */
    var BooleanLiteral = /** @class */ (function () {
        function BooleanLiteral(location, value) {
            this.location = location;
            this.value = value;
        }
        BooleanLiteral.prototype.accept = function (visitor) {
            return visitor.visitBooleanLiteral(this);
        };
        BooleanLiteral.prototype.equals = function (other) {
            if (other instanceof BooleanLiteral) {
                return this.value === other.value;
            }
            return false;
        };
        return BooleanLiteral;
    }());
    Atomic.BooleanLiteral = BooleanLiteral;
    /**
     * A node that represents a Scheme string.
     */
    var StringLiteral = /** @class */ (function () {
        function StringLiteral(location, value) {
            this.location = location;
            this.value = value;
        }
        StringLiteral.prototype.accept = function (visitor) {
            return visitor.visitStringLiteral(this);
        };
        StringLiteral.prototype.equals = function (other) {
            if (other instanceof StringLiteral) {
                return this.value === other.value;
            }
            return false;
        };
        return StringLiteral;
    }());
    Atomic.StringLiteral = StringLiteral;
    /**
     * A node representing a Scheme lambda expression.
     * TODO: Support rest arguments.
     */
    var Lambda = /** @class */ (function () {
        function Lambda(location, body, params, rest) {
            if (rest === void 0) { rest = undefined; }
            this.location = location;
            this.params = params;
            this.rest = rest;
            this.body = body;
        }
        Lambda.prototype.accept = function (visitor) {
            return visitor.visitLambda(this);
        };
        Lambda.prototype.equals = function (other) {
            if (other instanceof Lambda) {
                if (this.params.length !== other.params.length) {
                    return false;
                }
                for (var i = 0; i < this.params.length; i++) {
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
        };
        return Lambda;
    }());
    Atomic.Lambda = Lambda;
    /**
     * A node representing a Scheme identifier.
     */
    var Identifier = /** @class */ (function () {
        function Identifier(location, name) {
            this.location = location;
            this.name = name;
        }
        Identifier.prototype.accept = function (visitor) {
            return visitor.visitIdentifier(this);
        };
        Identifier.prototype.equals = function (other) {
            if (other instanceof Identifier) {
                return this.name === other.name;
            }
            return false;
        };
        return Identifier;
    }());
    Atomic.Identifier = Identifier;
    /**
     * A node representing a Scheme variable definition.
     * Returns nil.
     */
    var Definition = /** @class */ (function () {
        function Definition(location, name, value) {
            this.location = location;
            this.name = name;
            this.value = value;
        }
        Definition.prototype.accept = function (visitor) {
            return visitor.visitDefinition(this);
        };
        Definition.prototype.equals = function (other) {
            if (other instanceof Definition) {
                return this.name.equals(other.name) && this.value.equals(other.value);
            }
            return false;
        };
        return Definition;
    }());
    Atomic.Definition = Definition;
    /**
     * A node representing a Scheme function application.
     */
    var Application = /** @class */ (function () {
        function Application(location, operator, operands) {
            this.location = location;
            this.operator = operator;
            this.operands = operands;
        }
        Application.prototype.accept = function (visitor) {
            return visitor.visitApplication(this);
        };
        Application.prototype.equals = function (other) {
            if (other instanceof Application) {
                if (!this.operator.equals(other.operator)) {
                    return false;
                }
                if (this.operands.length !== other.operands.length) {
                    return false;
                }
                for (var i = 0; i < this.operands.length; i++) {
                    if (!this.operands[i].equals(other.operands[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };
        return Application;
    }());
    Atomic.Application = Application;
    /**
     * A node representing a Scheme conditional expression.
     */
    var Conditional = /** @class */ (function () {
        function Conditional(location, test, consequent, alternate) {
            this.location = location;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
        }
        Conditional.prototype.accept = function (visitor) {
            return visitor.visitConditional(this);
        };
        Conditional.prototype.equals = function (other) {
            if (other instanceof Conditional) {
                return (this.test.equals(other.test) &&
                    this.consequent.equals(other.consequent) &&
                    this.alternate.equals(other.alternate));
            }
            return false;
        };
        return Conditional;
    }());
    Atomic.Conditional = Conditional;
    // Scheme chapter 2
    /**
     * A node representing a Scheme pair.
     */
    var Pair = /** @class */ (function () {
        function Pair(location, car, cdr) {
            this.location = location;
            this.car = car;
            this.cdr = cdr;
        }
        Pair.prototype.accept = function (visitor) {
            return visitor.visitPair(this);
        };
        Pair.prototype.equals = function (other) {
            if (other instanceof Pair) {
                return this.car.equals(other.car) && this.cdr.equals(other.cdr);
            }
            return false;
        };
        return Pair;
    }());
    Atomic.Pair = Pair;
    /**
     * A node representing nil, an empty scheme list.
     */
    var Nil = /** @class */ (function () {
        function Nil(location) {
            this.location = location;
        }
        Nil.prototype.accept = function (visitor) {
            return visitor.visitNil(this);
        };
        Nil.prototype.equals = function (other) {
            return other instanceof Nil;
        };
        return Nil;
    }());
    Atomic.Nil = Nil;
    /**
     * A node representing a Scheme symbol.
     */
    var Symbol = /** @class */ (function () {
        function Symbol(location, value) {
            this.location = location;
            this.value = value;
        }
        Symbol.prototype.accept = function (visitor) {
            return visitor.visitSymbol(this);
        };
        Symbol.prototype.equals = function (other) {
            if (other instanceof Symbol) {
                return this.value === other.value;
            }
            return false;
        };
        return Symbol;
    }());
    Atomic.Symbol = Symbol;
    /**
     * A node representing a Scheme marker for unquote_splicing.
     * This will be evaluated at runtime.
     */
    var SpliceMarker = /** @class */ (function () {
        function SpliceMarker(location, value) {
            this.location = location;
            this.value = value;
        }
        SpliceMarker.prototype.accept = function (visitor) {
            return visitor.visitSpliceMarker(this);
        };
        SpliceMarker.prototype.equals = function (other) {
            if (other instanceof SpliceMarker) {
                return this.value.equals(other.value);
            }
            return false;
        };
        return SpliceMarker;
    }());
    Atomic.SpliceMarker = SpliceMarker;
    // Scheme chapter 3
    /**
     * A node representing a Scheme variable reassignment.
     * Only supposed to be used on a variable that has been defined.
     * Returns nil.
     */
    var Reassignment = /** @class */ (function () {
        function Reassignment(location, name, value) {
            this.location = location;
            this.name = name;
            this.value = value;
        }
        Reassignment.prototype.accept = function (visitor) {
            return visitor.visitReassignment(this);
        };
        Reassignment.prototype.equals = function (other) {
            if (other instanceof Reassignment) {
                return this.name.equals(other.name) && this.value.equals(other.value);
            }
            return false;
        };
        return Reassignment;
    }());
    Atomic.Reassignment = Reassignment;
    // scm-slang specific
    /**
     * A node representing an import statement.
     * syntax: (import <source> ( <identifier>* ))
     * Returns nil.
     */
    var Import = /** @class */ (function () {
        function Import(location, source, identifiers) {
            this.location = location;
            this.source = source;
            this.identifiers = identifiers;
        }
        Import.prototype.accept = function (visitor) {
            return visitor.visitImport(this);
        };
        Import.prototype.equals = function (other) {
            if (other instanceof Import) {
                if (!this.source.equals(other.source)) {
                    return false;
                }
                if (this.identifiers.length !== other.identifiers.length) {
                    return false;
                }
                for (var i = 0; i < this.identifiers.length; i++) {
                    if (!this.identifiers[i].equals(other.identifiers[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };
        return Import;
    }());
    Atomic.Import = Import;
    /**
     * A node representing an export statement.
     * syntax: (export ( <definition> ))
     * Returns nil.
     */
    var Export = /** @class */ (function () {
        function Export(location, definition) {
            this.location = location;
            this.definition = definition;
        }
        Export.prototype.accept = function (visitor) {
            return visitor.visitExport(this);
        };
        Export.prototype.equals = function (other) {
            if (other instanceof Export) {
                return this.definition.equals(other.definition);
            }
            return false;
        };
        return Export;
    }());
    Atomic.Export = Export;
    /**
     * A node representing a Scheme Vector.
     */
    var Vector = /** @class */ (function () {
        function Vector(location, elements) {
            this.location = location;
            this.elements = elements;
        }
        Vector.prototype.accept = function (visitor) {
            return visitor.visitVector(this);
        };
        Vector.prototype.equals = function (other) {
            if (other instanceof Vector) {
                if (this.elements.length !== other.elements.length) {
                    return false;
                }
                for (var i = 0; i < this.elements.length; i++) {
                    if (!this.elements[i].equals(other.elements[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };
        return Vector;
    }());
    Atomic.Vector = Vector;
    /**
     * A node representing a Scheme define-syntax expression.
     */
    var DefineSyntax = /** @class */ (function () {
        function DefineSyntax(location, name, transformer) {
            this.location = location;
            this.name = name;
            this.transformer = transformer;
        }
        DefineSyntax.prototype.accept = function (visitor) {
            return visitor.visitDefineSyntax(this);
        };
        DefineSyntax.prototype.equals = function (other) {
            if (other instanceof DefineSyntax) {
                return (this.name.equals(other.name) &&
                    this.transformer.equals(other.transformer));
            }
            return false;
        };
        return DefineSyntax;
    }());
    Atomic.DefineSyntax = DefineSyntax;
    /**
     * A node representing a Scheme syntax-rules expression.
     */
    var SyntaxRules = /** @class */ (function () {
        function SyntaxRules(location, literals, rules) {
            this.location = location;
            this.literals = literals;
            this.rules = rules;
        }
        SyntaxRules.prototype.accept = function (visitor) {
            return visitor.visitSyntaxRules(this);
        };
        SyntaxRules.prototype.equals = function (other) {
            if (other instanceof SyntaxRules) {
                if (this.literals.length !== other.literals.length) {
                    return false;
                }
                for (var i = 0; i < this.literals.length; i++) {
                    if (!this.literals[i].equals(other.literals[i])) {
                        return false;
                    }
                }
                if (this.rules.length !== other.rules.length) {
                    return false;
                }
                for (var i = 0; i < this.rules.length; i++) {
                    if (!this.rules[i][0].equals(other.rules[i][0]) ||
                        !this.rules[i][1].equals(other.rules[i][1])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };
        return SyntaxRules;
    }());
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
    var FunctionDefinition = /** @class */ (function () {
        function FunctionDefinition(location, name, body, params, rest) {
            if (rest === void 0) { rest = undefined; }
            this.location = location;
            this.name = name;
            this.body = body;
            this.params = params;
            this.rest = rest;
        }
        FunctionDefinition.prototype.accept = function (visitor) {
            return visitor.visitFunctionDefinition(this);
        };
        FunctionDefinition.prototype.equals = function (other) {
            if (other instanceof FunctionDefinition) {
                if (this.params.length !== other.params.length) {
                    return false;
                }
                for (var i = 0; i < this.params.length; i++) {
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
        };
        return FunctionDefinition;
    }());
    Extended.FunctionDefinition = FunctionDefinition;
    /**
     * A node representing a Scheme let expression.
     */
    var Let = /** @class */ (function () {
        function Let(location, identifiers, values, body) {
            this.location = location;
            this.identifiers = identifiers;
            this.values = values;
            this.body = body;
        }
        Let.prototype.accept = function (visitor) {
            return visitor.visitLet(this);
        };
        Let.prototype.equals = function (other) {
            if (other instanceof Let) {
                if (this.identifiers.length !== other.identifiers.length) {
                    return false;
                }
                for (var i = 0; i < this.identifiers.length; i++) {
                    if (!this.identifiers[i].equals(other.identifiers[i])) {
                        return false;
                    }
                }
                if (this.values.length !== other.values.length) {
                    return false;
                }
                for (var i = 0; i < this.values.length; i++) {
                    if (!this.values[i].equals(other.values[i])) {
                        return false;
                    }
                }
                return this.body.equals(other.body);
            }
            return false;
        };
        return Let;
    }());
    Extended.Let = Let;
    /**
     * A node representing a Scheme cond expression.
     * MAY return nil.
     */
    var Cond = /** @class */ (function () {
        function Cond(location, predicates, consequents, catchall) {
            this.location = location;
            this.predicates = predicates;
            this.consequents = consequents;
            this.catchall = catchall;
        }
        Cond.prototype.accept = function (visitor) {
            return visitor.visitCond(this);
        };
        Cond.prototype.equals = function (other) {
            if (other instanceof Cond) {
                if (this.predicates.length !== other.predicates.length) {
                    return false;
                }
                for (var i = 0; i < this.predicates.length; i++) {
                    if (!this.predicates[i].equals(other.predicates[i])) {
                        return false;
                    }
                }
                if (this.consequents.length !== other.consequents.length) {
                    return false;
                }
                for (var i = 0; i < this.consequents.length; i++) {
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
        };
        return Cond;
    }());
    Extended.Cond = Cond;
    // Scheme chapter 2
    /**
     * A node representing a Scheme list or dotted list.
     */
    var List = /** @class */ (function () {
        function List(location, elements, terminator) {
            if (terminator === void 0) { terminator = undefined; }
            this.location = location;
            this.elements = elements;
            this.terminator = terminator;
        }
        List.prototype.accept = function (visitor) {
            return visitor.visitList(this);
        };
        List.prototype.equals = function (other) {
            if (other instanceof List) {
                if (this.elements.length !== other.elements.length) {
                    return false;
                }
                for (var i = 0; i < this.elements.length; i++) {
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
        };
        return List;
    }());
    Extended.List = List;
    // Scheme chapter 3
    /**
     * A node representing a Scheme begin expression.
     * Returns the last expression.
     * syntax: (begin <expression>*)
     */
    var Begin = /** @class */ (function () {
        function Begin(location, expressions) {
            this.location = location;
            this.expressions = expressions;
        }
        Begin.prototype.accept = function (visitor) {
            return visitor.visitBegin(this);
        };
        Begin.prototype.equals = function (other) {
            if (other instanceof Begin) {
                if (this.expressions.length !== other.expressions.length) {
                    return false;
                }
                for (var i = 0; i < this.expressions.length; i++) {
                    if (!this.expressions[i].equals(other.expressions[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };
        return Begin;
    }());
    Extended.Begin = Begin;
    /**
     * A node representing a Scheme delay expression.
     * Returns a promise.
     * syntax: (delay <expression>)
     */
    var Delay = /** @class */ (function () {
        function Delay(location, expression) {
            this.location = location;
            this.expression = expression;
        }
        Delay.prototype.accept = function (visitor) {
            return visitor.visitDelay(this);
        };
        Delay.prototype.equals = function (other) {
            if (other instanceof Delay) {
                return this.expression.equals(other.expression);
            }
            return false;
        };
        return Delay;
    }());
    Extended.Delay = Delay;
})(Extended || (exports.Extended = Extended = {}));
