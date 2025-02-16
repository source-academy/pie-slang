import { Environment, getValueFromEnvironment } from './environment';
import * as V from "./value";
import {TODO as N_TOTO } from './neutral';
import { FirstOrderClosure, isVarName, SourceLocation } from './utils';
import * as Evaluator from '../normalize/evaluator';
import {later} from '../normalize/utils';
import { Location } from '../locations';
import { Neutral } from './neutral';

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
    return Evaluator.doWhichNat(
      later(env, this.target),
      later(env, this.base.type),
      later(env, this.base.expr),
      later(env, this.step)
    );
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
    return Evaluator.doIterNat(
      later(env, this.target),
      later(env, this.base.type),
      later(env, this.base.expr),
      later(env, this.step)
    );
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
    return Evaluator.doRecNat(
      later(env, this.target),
      later(env, this.base.type),
      later(env, this.base.expr),
      later(env, this.step)
    );
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
    return Evaluator.doIndNat(
      later(env, this.target),
      later(env, this.motive),
      later(env, this.base),
      later(env, this.step)
    );
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
    const [x, A] = this.bindings[0];
    const Av = later(env, A);
    return new V.Pi(x, Av, 
      new FirstOrderClosure(env, x, this.body));
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
    return new V.Lambda(this.params[0], 
      new FirstOrderClosure(env, this.params[0], this.body));
  }
}

export class Atom extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Atom();
  }
}

export class Quote extends Core {
  constructor(
    public sym: string
  ) {
    super();
  }

//TODO : Test this
  public valOf(env: Environment): V.Value {
    return new V.Quote(this.sym);
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
    const [x, A] = this.bindings[0];
    const Av = later(env, A);
    return new V.Sigma(x, Av, 
      new FirstOrderClosure(env, x, this.body));
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
    const first = later(env, this.first);
    const second = later(env, this.second);
    return new V.Cons(first, second);
  }
}

export class Car extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return Evaluator.doCar(later(env, this.pair));
  }
}

export class Cdr extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return Evaluator.doCdr(later(env, this.pair));
  }
}

export class ListCons extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    const head = later(env, this.head);
    const tail = later(env, this.tail);
    return new V.ListCons(head, tail);
  }
}

export class Nil extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Nil();
  }
}

export class List extends Core {
  constructor(
    public elemType: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return new V.List(later(env, this.elemType));
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
    return Evaluator.doRecList(
      later(env, this.target),
      later(env, this.base.type),
      later(env, this.base.expr),
      later(env, this.step)
    );
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
    return Evaluator.doIndList(
      later(env, this.target),
      later(env, this.motive),
      later(env, this.base),
      later(env, this.step)
    );
  }
}

export class Absurd extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Absurd();
  }

}

export class Trivial extends Core {
  public valOf(env: Environment): V.Value {
    return new V.Trivial();
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
    return Evaluator.doIndAbsurd(
      later(env, this.target),
      later(env, this.motive)
    );
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
    return new V.Equal(
      later(env, this.type),
      later(env, this.left),
      later(env, this.right)
    );
  }
}

export class Same extends Core {
  constructor(
    public expr: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return new V.Same(later(env, this.expr));
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
    return Evaluator.doReplace(
      later(env, this.target),
      later(env, this.motive),
      later(env, this.base)
    );
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
    return Evaluator.doTrans(
      later(env, this.left),
      later(env, this.right)
    );
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
    return Evaluator.doCong(
      later(env, this.fn),
      later(env, this.left),
      later(env, this.right)
    );
  }
}

export class Symm extends Core {
  constructor(
    public equality: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return Evaluator.doSymm(
      later(env, this.equality)
    );
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
    return Evaluator.doIndEqual(
      later(env, this.target),
      later(env, this.motive),
      later(env, this.base)
    );
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
    return new V.Vec(later(env, this.elemType), later(env, this.length));
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
    return new V.VecCons(later(env, this.head), later(env, this.tail));
  }
}

export class VecNil extends Core {

  public valOf(env: Environment): V.Value {
    return new V.VecNil();
  }
}

export class Head extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return Evaluator.doHead(later(env, this.vec));
  }
}

export class Tail extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return Evaluator.doTail(later(env, this.vec));
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
    return Evaluator.doIndV_Vec(
      later(env, this.length),
      later(env, this.target),
      later(env, this.motive),
      later(env, this.base),
      later(env, this.step)
    );
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
    return new V.Either(later(env, this.left), later(env, this.right));
  }
}

export class Left extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return new V.Left(later(env, this.value));
  }
}

export class Right extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return new V.Right(later(env, this.value));
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
    return Evaluator.doIndEither(
      later(env, this.target),
      later(env, this.motive),
      later(env, this.baseLeft),
      later(env, this.baseRight)
    );
  }
}

export class TODO extends Core {
  constructor(
    public loc: SourceLocation,
    public type: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return new V.Neutral(
      later(env, this.type),
      new N_TOTO(this.loc, later(env, this.type))
    )
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
    return Evaluator.doApp(
      later(env, this.fn),
      later(env, this.arg)
    );
  }
}