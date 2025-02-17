import { Core } from "./core";
import { Environment } from "./environment";
import * as N from "./neutral";
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

export abstract class Value {

  public now(): Value {
    return this;
  }

}

export class DelayClosure {
  env: Environment;
  expr: Core;

  constructor(env: Environment, expr: Core) {
    this.env = env;
    this.expr = expr;
  }

  public undelay(): Value {
    return this.expr.valOf(this.env).now();
  } 
}

export class Box<Type> {
  content: Type;

  constructor(value: Type) {
    this.content = value;
  }

  public get() {
    return this.content;
  }
  public set(value: Type) {
    this.content = value;
  }
}


export class Delay extends Value {

  constructor(public val: Box<DelayClosure | Value>) { super() }

  public now(): Value {
    const boxContent = this.val.get();
    if (boxContent instanceof DelayClosure) {
      let theValue = boxContent.undelay();
      this.val.set(theValue);
      return theValue;
    } else { // content is a Value (content instanceof Value).
      return boxContent as Value;
    }
  }
}

export class Quote extends Value {
  constructor(public name: string) { super() }
}

export class Add1 extends Value {
  constructor(public smaller: Value) { super() }
}

export class Pi extends Value {
  constructor(
    public argName: string,
    public argType: Value,
    public resultType: Closure
  ) { super() }
}

export class Lambda extends Value {
  constructor(
    public argName: string,
    public body: Closure
  ) { super() }
}

export class Sigma extends Value {
  constructor(
    public carName: string,
    public carType: Value,
    public cdrType: Closure
  ) { super() }
}

export class Cons extends Value {
  constructor(
    public car: Value,
    public cdr: Value
  ) { super() }
}

export class ListCons extends Value {
  constructor(
    public head: Value,
    public tail: Value
  ) { super() }
}

export class List extends Value {
  constructor(public entryType: Value) { super() }
}

export class Equal extends Value {
  constructor(
    public type: Value,
    public from: Value,
    public to: Value
  ) { super() }
}

export class Same extends Value {
  constructor(public value: Value) { super() }
}

export class Vec extends Value {
  constructor(
    public entryType: Value,
    public length: Value
  ) { super() }
}

export class VecCons extends Value {
  constructor(
    public head: Value,
    public tail: Value
  ) { super() }
}

export class Either extends Value {
  constructor(
    public leftType: Value,
    public rightType: Value
  ) { super() }
}

export class Left extends Value {
  constructor(public value: Value) { super() }
}

export class Right extends Value {
  constructor(public value: Value) { super() }
}

export class Neutral extends Value {
  constructor(
    public type: Value,
    public neutral: N.Neutral
  ) { super() }
}

export class Universe extends Value {
  constructor() { super() }
}

export class Nat extends Value {
  constructor() { super() }
}

export class Zero extends Value {
  constructor() { super() }
}

export class Atom extends Value {
  constructor() { super() }
}

export class Trivial extends Value {
  constructor() { super() }
}

export class Sole extends Value {
  constructor() { super() }
}

export class Nil extends Value {
  constructor() { super() }
}

export class Absurd extends Value {
  constructor() { super() }
}

export class VecNil extends Value {
  constructor() { super() }
}