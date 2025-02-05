import { Core } from "./core";
import { Environment } from "./environment";
import { Neutral } from "./neutral";
import { Closure } from "./utils";

/*
    ## Values ##
    
    In order to type check Pie, it is necessary to find the normal
    forms of expressions and compare them with each other. The normal
    form of an expression is determined by its type - types that have
    η-rules (such as Π, Σ, Trivial, and Absurd) impose requirements on
    the normal form. For instance, every normal function has λ at the
    top, and every normal pair has cons at the top.

    Finding normal forms has two steps: first, programs are evaluated,
    much as they are with the Scheme interpreter at the end of The
    Little Schemer. Then, these values are "read back" into the syntax
    of their normal forms. This happens in normalize.rkt. This file
    defines the values that expressions can have. Structures or symbols
    that represent values are written with prefix V_.

    Laziness is implemented by allowing values to be a closure that
    does not bind a variable. It is described in normalize.rkt (search
    for "Call-by-need").
*/

export abstract class Value { }

export class DelayClosure {
  env: Environment;
  expr: Core;

  constructor(env: Environment, expr: Core) {
    this.env = env;
    this.expr = expr;
  }
}

export class Box<Type> {
  contents: Type;

  constructor(value: Type) {
    this.contents = value;
  }
}


export class V_Delay extends Value {
  constructor(public val: Box<DelayClosure | Value>) { super() }
}

export class V_Quote extends Value {
  constructor(public name: string) { super() }
}

export class V_Add1 extends Value {
  constructor(public smaller: Value) { super() }
}

export class V_Pi extends Value {
  constructor(
    public argName: Symbol,
    public argType: Value,
    public resultType: Closure
  ) { super() }
}

export class V_Lambda extends Value {
  constructor(
    public argName: Symbol,
    public body: Closure
  ) { super() }
}

export class V_Sigma extends Value {
  constructor(
    public carName: Symbol,
    public carType: Value,
    public cdrType: Closure
  ) { super() }
}

export class V_Cons extends Value {
  constructor(
    public car: Value,
    public cdr: Value
  ) { super() }
}

export class V_ListCons extends Value {
  constructor(
    public head: Value,
    public tail: Value
  ) { super() }
}

export class V_List extends Value {
  constructor(public entryType: Value) { super() }
}

export class V_Equal extends Value {
  constructor(
    public type: Value,
    public from: Value,
    public to: Value
  ) { super() }
}

export class V_Same extends Value {
  constructor(public value: Value) { super() }
}

export class V_Vec extends Value {
  constructor(
    public entryType: Value,
    public length: Value
  ) { super() }
}

export class V_VecCons extends Value {
  constructor(
    public head: Value,
    public tail: Value
  ) { super() }
}

export class V_Either extends Value {
  constructor(
    public leftType: Value,
    public rightType: Value
  ) { super() }
}

export class V_Left extends Value {
  constructor(public value: Value) { super() }
}

export class V_Right extends Value {
  constructor(public value: Value) { super() }
}

export class V_Neutral extends Value {
  constructor(
    public type: Value,
    public neutral: Neutral
  ) { super() }
}

export class V_Universe extends Value {
  constructor() { super() }
}

export class V_Nat extends Value {
  constructor() { super() }
}

export class V_Zero extends Value {
  constructor() { super() }
}

export class V_Atom extends Value {
  constructor() { super() }
}

export class V_Trivial extends Value {
  constructor() { super() }
}

export class V_Sole extends Value {
  constructor() { super() }
}

export class V_Nil extends Value {
  constructor() { super() }
}

export class V_Absurd extends Value {
  constructor() { super() }
}

export class V_VecNil extends Value {
  constructor() { super() }
}