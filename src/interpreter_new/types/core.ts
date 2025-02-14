import { Environment, getValueFromEnvironment } from './environment';
import * as V from "./value";
import { isVarName } from './utils';
import { later } from '../normalize';
export abstract class Core {
  public abstract valOf(env: Environment): V.Value;
}

export class The extends Core {
  constructor(
    public type: Core,
    public expr: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return this.expr.valOf(env);
  }
}

export class U extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Universe();
  }
}

export class Nat extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Nat();
  }
}

export class Zero extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Zero();
  }
}

export class VarName extends Core {
  constructor(
    public name: string
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    if(isVarName(this.name)) {
      return getValueFromEnvironment(env, this.name);
    } else {
      throw new Error(`{this.name} is not a valid variable name`);
    }
  }
}

export class Add1 extends Core {
  constructor(
    public n: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return new V.Add1(later(env, this.n));
  }
}

export class WhichNat extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class IterNat extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class RecNat extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class IndNat extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Pi extends Core {
  constructor(
    public bindings: Array<[string, Core]>,
    public body: Core
  ) {
    super()
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Lambda extends Core {
  constructor(
    public params: Array<string>,
    public body: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Atom extends Core {

  public valOf(env: Environment): V.Value {
    
  }
}

export class Quote extends Core {
  constructor(
    public sym: string
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Sigma extends Core {
  constructor(
    public bindings: Array<[string, Core]>,
    public body: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Cons extends Core {
  constructor(
    public first: Core,
    public second: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Car extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Cdr extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class ConsList extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Nil extends Core {

  public valOf(env: Environment): V.Value {
    
  }
}

export class List extends Core {
  constructor(
    public elemType: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class RecList extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class IndList extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Absurd extends Core {

  public valOf(env: Environment): V.Value {
    
  }

}

export class Trivial extends Core {
  public valOf(env: Environment): V.Value {
    
  }
}

export class IndAbsurd extends Core {
  constructor(
    public target: Core,
    public motive: Core
  ) {
    super();
  }

  
  public valOf(env: Environment): V.Value {
    
  }
}

export class Equal extends Core {
  constructor(
    public type: Core,
    public left: Core,
    public right: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Same extends Core {
  constructor(
    public expr: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Replace extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Trans extends Core {
  constructor(
    public left: Core,
    public right: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Cong extends Core {
  constructor(
    public fn: Core,
    public left: Core,
    public right: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Symm extends Core {
  constructor(
    public equality: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class IndEqual extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Vec extends Core {
  constructor(
    public elemType: Core,
    public length: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class VecCons extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class VecNil extends Core {

  public valOf(env: Environment): V.Value {
    
  }
}

export class Head extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Tail extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class IndVec extends Core {
  constructor(
    public length: Core,
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Either extends Core {
  constructor(
    public left: Core,
    public right: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Left extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class Right extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    
  }
}

export class IndEither extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public baseLeft: Core,
    public baseRight: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class TODO extends Core {
  constructor(
    public loc: Location,
    public type: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}

export class Application extends Core {
  constructor(
    public fn: Core,
    public arg: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    
  }
}