import { Environment, getValueFromEnvironment } from './environment';
import * as V from "./value";
import * as N from './neutral';
import { FirstOrderClosure, isVarName, SourceLocation } from './utils';
import * as Evaluator from '../normalize/evaluator';


/*
  ### Core Types ###

    Core Pie expressions are the result of type checking (elaborating)
    an expression written in Pie. They do not have source positions,
    because they by definition are not written by a user of the
    implementation.

*/
export abstract class Core {

  public abstract valOf(env: Environment): V.Value;

  /*
    Original "later" function. It is used to delay the evaluation.
  */
  public toLazy(env: Environment): V.Value {
    return new V.Delay(new V.Box(new V.DelayClosure(env, this)));
  }

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

export class Universe extends Core {

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
    return new V.Add1(this.n.toLazy(env));
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
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env),
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
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env)
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
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env)
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
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
      this.step.toLazy(env),
    );
  }
}

export class Pi extends Core {
  constructor(
    public name: string,
    public type: Core,
    public body: Core
  ) {
    super()
  }
  public valOf(env: Environment): V.Value {
    const typeVal = this.type.toLazy(env);
    return new V.Pi(this.name, typeVal, 
      new FirstOrderClosure(env, this.name, this.body)
    );
  }
}

export class Lambda extends Core {
  constructor(
    public param: string,
    public body: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return new V.Lambda(this.param, 
      new FirstOrderClosure(env, this.param, this.body));
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
    public name: string,
    public type: Core,
    public body: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    const typeVal = this.type.toLazy(env);
    return new V.Sigma(this.name, typeVal, 
      new FirstOrderClosure(env, this.name, this.body));
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
    const first = this.first.toLazy(env);
    const second = this.second.toLazy(env);
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
    return Evaluator.doCar(this.pair.toLazy(env));
  }
}

export class Cdr extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return Evaluator.doCdr(this.pair.toLazy(env));
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
    const head = this.head.toLazy(env);
    const tail = this.tail.toLazy(env);;
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
    return new V.List(this.elemType.toLazy(env));
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
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env),
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
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
      this.step.toLazy(env),
    );
  }
}

export class Absurd extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Absurd();
  }

}

export class Sole extends Core {
  public valOf(env: Environment): V.Value {
    return new V.Sole();
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
      this.target.toLazy(env),
      this.motive.toLazy(env)
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
      this.type.toLazy(env),
      this.left.toLazy(env),
      this.right.toLazy(env),
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
    return new V.Same(this.expr.toLazy(env));
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
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
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
      this.left.toLazy(env),
      this.right.toLazy(env),
    );
  }
}

export class Cong extends Core {
  constructor(
    public fun: Core,
    public left: Core,
    public right: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return Evaluator.doCong(
      this.fun.toLazy(env),
      this.left.toLazy(env),
      this.right.toLazy(env),
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
      this.equality.toLazy(env)
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
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
    );
  }
}

export class Vec extends Core {
  constructor(
    public type: Core,
    public length: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return new V.Vec(
      this.type.toLazy(env), 
      this.length.toLazy(env)
    );
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
    return new V.VecCons(
      this.head.toLazy(env),
      this.tail.toLazy(env),
    );
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
    return Evaluator.doHead(this.vec.toLazy(env));
  }
}

export class Tail extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return Evaluator.doTail(this.vec.toLazy(env));
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
    return Evaluator.doIndVec(
      this.length.toLazy(env),
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
      this.step.toLazy(env),
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
    return new V.Either(this.left.toLazy(env), this.right.toLazy(env));
  }
}

export class Left extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return new V.Left(this.value.toLazy(env));
  }
}

export class Right extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }
  public valOf(env: Environment): V.Value {
    return new V.Right(this.value.toLazy(env));
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
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.baseLeft.toLazy(env),
      this.baseRight.toLazy(env),
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
      this.type.toLazy(env),
      new N.TODO(this.loc, this.type.toLazy(env),)
    )
  }
}

export class Application extends Core {
  constructor(
    public fun: Core,
    public arg: Core
  ) {
    super();
  }

  public valOf(env: Environment): V.Value {
    return Evaluator.doApp(
      this.fun.toLazy(env),
      this.arg.toLazy(env),
    );
  }
}