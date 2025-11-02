/**
 * Node types of the abstract syntax tree of the Scheme Language.
 * We aim to be as simple as possible, and only represent the bare minimum
 * of Scheme syntax.
 *
 * Syntatic sugar such as "cond" or "let" will be left in another file,
 * and will be translated into the bare minimum of Scheme syntax, for now
 * with a transformer visitor, and perhaps later with a macro system.
 */
import { Visitor } from "../../visitors";
import { Location } from "../location";
/**
 * A basic node that represents a Scheme expression.
 */
export interface Expression {
    location: Location;
    accept(visitor: Visitor): any;
    equals(other: Expression): boolean;
}
/**
 * The namespace for all the atomic node types.
 */
export declare namespace Atomic {
    /**
     * A node that represents a sequence of expressions.
     * Also introduces a new scope.
     * The last expression is the return value of the sequence.
     */
    class Sequence implements Expression {
        location: Location;
        expressions: Expression[];
        constructor(location: Location, expressions: Expression[]);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node that represents a Scheme literal.
     */
    interface Literal extends Expression {
        value: any;
    }
    /**
     * A node that represents a Scheme number.
     * TODO: Support the Scheme number tower.
     */
    class NumericLiteral implements Literal {
        location: Location;
        value: string;
        constructor(location: Location, value: string);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node that represents a Scheme boolean.
     */
    class BooleanLiteral implements Literal {
        location: Location;
        value: boolean;
        constructor(location: Location, value: boolean);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node that represents a Scheme string.
     */
    class StringLiteral implements Literal {
        location: Location;
        value: string;
        constructor(location: Location, value: string);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme lambda expression.
     * TODO: Support rest arguments.
     */
    class Lambda implements Expression {
        location: Location;
        params: Identifier[];
        rest?: Identifier;
        body: Expression;
        constructor(location: Location, body: Expression, params: Identifier[], rest?: Identifier | undefined);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme identifier.
     */
    class Identifier implements Expression {
        location: Location;
        name: string;
        constructor(location: Location, name: string);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme variable definition.
     * Returns nil.
     */
    class Definition implements Expression {
        location: Location;
        name: Identifier;
        value: Expression;
        constructor(location: Location, name: Identifier, value: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme function application.
     */
    class Application implements Expression {
        location: Location;
        operator: Expression;
        operands: Expression[];
        constructor(location: Location, operator: Expression, operands: Expression[]);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme conditional expression.
     */
    class Conditional implements Expression {
        location: Location;
        test: Expression;
        consequent: Expression;
        alternate: Expression;
        constructor(location: Location, test: Expression, consequent: Expression, alternate: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme pair.
     */
    class Pair implements Expression {
        location: Location;
        car: Expression;
        cdr: Expression;
        constructor(location: Location, car: Expression, cdr: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing nil, an empty scheme list.
     */
    class Nil implements Expression {
        location: Location;
        constructor(location: Location);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme symbol.
     */
    class Symbol implements Literal {
        location: Location;
        value: string;
        constructor(location: Location, value: string);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme marker for unquote_splicing.
     * This will be evaluated at runtime.
     */
    class SpliceMarker implements Expression {
        location: Location;
        value: Expression;
        constructor(location: Location, value: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme variable reassignment.
     * Only supposed to be used on a variable that has been defined.
     * Returns nil.
     */
    class Reassignment implements Expression {
        location: Location;
        name: Identifier;
        value: Expression;
        constructor(location: Location, name: Identifier, value: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing an import statement.
     * syntax: (import <source> ( <identifier>* ))
     * Returns nil.
     */
    class Import implements Expression {
        location: Location;
        source: StringLiteral;
        identifiers: Identifier[];
        constructor(location: Location, source: StringLiteral, identifiers: Identifier[]);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing an export statement.
     * syntax: (export ( <definition> ))
     * Returns nil.
     */
    class Export implements Expression {
        location: Location;
        definition: Definition | Extended.FunctionDefinition;
        constructor(location: Location, definition: Definition | Extended.FunctionDefinition);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme Vector.
     */
    class Vector implements Expression {
        location: Location;
        elements: Expression[];
        constructor(location: Location, elements: Expression[]);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme define-syntax expression.
     */
    class DefineSyntax implements Expression {
        location: Location;
        name: Identifier;
        transformer: SyntaxRules;
        constructor(location: Location, name: Identifier, transformer: SyntaxRules);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme syntax-rules expression.
     */
    class SyntaxRules implements Expression {
        location: Location;
        literals: Symbol[];
        rules: [Expression, Expression][];
        constructor(location: Location, literals: Symbol[], rules: [Expression, Expression][]);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
}
/**
 * The namespace for all the syntactic sugar node types.
 * Will be transformed into the bare minimum of Scheme syntax.
 * Eventually, we won't need this namespace, as all the syntactic sugar
 * will be converted by a macro system.
 */
export declare namespace Extended {
    /**
     * A node representing a function definition.
     */
    class FunctionDefinition implements Expression {
        location: Location;
        name: Atomic.Identifier;
        params: Atomic.Identifier[];
        rest?: Atomic.Identifier;
        body: Expression;
        constructor(location: Location, name: Atomic.Identifier, body: Expression, params: Atomic.Identifier[], rest?: Atomic.Identifier | undefined);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme let expression.
     */
    class Let implements Expression {
        location: Location;
        identifiers: Atomic.Identifier[];
        values: Expression[];
        body: Expression;
        constructor(location: Location, identifiers: Atomic.Identifier[], values: Expression[], body: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme cond expression.
     * MAY return nil.
     */
    class Cond implements Expression {
        location: Location;
        predicates: Expression[];
        consequents: Expression[];
        catchall: Expression | undefined;
        constructor(location: Location, predicates: Expression[], consequents: Expression[], catchall?: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme list or dotted list.
     */
    class List implements Expression {
        location: Location;
        elements: Expression[];
        terminator: Expression | undefined;
        constructor(location: Location, elements: Expression[], terminator?: Expression | undefined);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme begin expression.
     * Returns the last expression.
     * syntax: (begin <expression>*)
     */
    class Begin implements Expression {
        location: Location;
        expressions: Expression[];
        constructor(location: Location, expressions: Expression[]);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
    /**
     * A node representing a Scheme delay expression.
     * Returns a promise.
     * syntax: (delay <expression>)
     */
    class Delay implements Expression {
        location: Location;
        expression: Expression;
        constructor(location: Location, expression: Expression);
        accept(visitor: Visitor): any;
        equals(other: Expression): boolean;
    }
}
//# sourceMappingURL=scheme-node-types.d.ts.map