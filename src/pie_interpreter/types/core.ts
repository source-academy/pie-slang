import * as V from "./value";
import * as N from './neutral';

import * as Evaluator from '../evaluator/evaluator';
import { Environment, getValueFromEnvironment} from '../utils/environment';
import { SourceLocation } from '../utils/locations';
import { FirstOrderClosure, isVarName } from './utils';



/*
  ### Core Types ###

    Core Pie expressions are the result of type checking (elaborating)
    an expression written in Pie. They do not have source positions,
    because they by definition are not written by a user of the
    implementation.

*/

export abstract class Core {

  public abstract valOf(env: Environment): V.Value;

  public abstract prettyPrint(): string;

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
  ) { super() }

  public valOf(env: Environment): V.Value {
    return this.expr.valOf(env);
  }

  public prettyPrint(): string {
    return `(the ${this.type.prettyPrint()} ${this.expr.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
}

export class Universe extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Universe();
  }

  public prettyPrint(): string {
    return 'U';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Nat extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Nat();
  }

  public prettyPrint(): string {
    return 'Nat';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Zero extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Zero();
  }

  public prettyPrint(): string {
    return '0';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}


export class Add1 extends Core {

  constructor(
    public n: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Add1(this.n.toLazy(env));
  }

  public prettyPrint(): string {
    if (!isNaN(Number(this.n.prettyPrint()))) {
      return `${Number(this.n.prettyPrint()) + 1}`;
    }
    return `(add1 ${this.n.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class WhichNat extends Core {

  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doWhichNat(
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(which-Nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IterNat extends Core {

  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIterNat(
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env)
    );
  }

  public prettyPrint(): string {
    return `(iter-Nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class RecNat extends Core {

  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doRecNat(
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env)
    );
  }

  public prettyPrint(): string {
    return `(rec-Nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndNat extends Core {

  constructor(
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIndNat(
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
      this.step.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(ind-Nat ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Pi extends Core {

  constructor(
    public name: string,
    public type: Core,
    public body: Core
  ) { super() }


  public valOf(env: Environment): V.Value {
    const typeVal = this.type.toLazy(env);
    return new V.Pi(this.name, typeVal, 
      new FirstOrderClosure(env, this.name, this.body)
    );
  }

  public prettyPrint(): string {
    return `(Π (${this.name} ${this.type.prettyPrint()}) 
          ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Lambda extends Core {

  constructor(
    public param: string,
    public body: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Lambda(this.param, 
      new FirstOrderClosure(env, this.param, this.body));
  }

  public prettyPrint(): string {
    return `(λ (${this.param}) ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Atom extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Atom();
  }

  public prettyPrint(): string {
    return 'Atom';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Quote extends Core {
  constructor(
    public sym: string
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Quote(this.sym);
  }

  public prettyPrint(): string {
    return `'${this.sym}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Sigma extends Core {

  constructor(
    public name: string,
    public type: Core,
    public body: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    const typeVal = this.type.toLazy(env);
    return new V.Sigma(this.name, typeVal, 
      new FirstOrderClosure(env, this.name, this.body));
  }

  public prettyPrint(): string {
    return `(Σ (${this.name} ${this.type.prettyPrint()}) 
              ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cons extends Core {

  constructor(
    public first: Core,
    public second: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    const first = this.first.toLazy(env);
    const second = this.second.toLazy(env);
    return new V.Cons(first, second);
  }

  public prettyPrint(): string {
    return `(cons ${this.first.prettyPrint()} ${this.second.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Car extends Core {

  constructor(
    public pair: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doCar(this.pair.toLazy(env));
  }

  public prettyPrint(): string {
    return `(car ${this.pair.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cdr extends Core {
  constructor(
    public pair: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doCdr(this.pair.toLazy(env));
  }

  public prettyPrint(): string {
    return `(cdr ${this.pair.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class ListCons extends Core {

  constructor(
    public head: Core,
    public tail: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    const head = this.head.toLazy(env);
    const tail = this.tail.toLazy(env);
    return new V.ListCons(head, tail);
  }

  public prettyPrint(): string {
    return `(:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Nil extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Nil();
  }

  public prettyPrint(): string {
    return 'nil';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class List extends Core {

  constructor(
    public elemType: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.List(this.elemType.toLazy(env));
  }

  public prettyPrint(): string {
    return `(List ${this.elemType.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class RecList extends Core {

  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doRecList(
      this.target.toLazy(env),
      this.base.type.toLazy(env),
      this.base.expr.toLazy(env),
      this.step.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(rec-List ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndList extends Core {

  constructor(
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIndList(
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
      this.step.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(ind-List ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Trivial extends Core {
  
  public valOf(env: Environment): V.Value {
    return new V.Trivial();
  }

  public prettyPrint(): string {
    return 'Trivial';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Sole extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Sole();
  }

  public prettyPrint(): string {
    return 'sole';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Absurd extends Core {

  public valOf(env: Environment): V.Value {
    return new V.Absurd();
  }

  public prettyPrint(): string {
    return 'Absurd';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndAbsurd extends Core {

  constructor(
    public target: Core,
    public motive: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIndAbsurd(
      this.target.toLazy(env),
      this.motive.toLazy(env)
    );
  }

  public prettyPrint(): string {
    return `(ind-Absurd 
              ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Equal extends Core {

  constructor(
    public type: Core,
    public left: Core,
    public right: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Equal(
      this.type.toLazy(env),
      this.left.toLazy(env),
      this.right.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(= ${this.type.prettyPrint()} 
              ${this.left.prettyPrint()} 
              ${this.right.prettyPrint()})`;  
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Same extends Core {

  constructor(
    public type: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Same(this.type.toLazy(env));
  }

  public prettyPrint(): string {
    return `(same ${this.type.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Replace extends Core {

  constructor(
    public target: Core,
    public motive: Core,
    public base: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doReplace(
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(replace ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Trans extends Core {

  constructor(
    public left: Core,
    public right: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doTrans(
      this.left.toLazy(env),
      this.right.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(trans ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cong extends Core {

  constructor(
    public target: Core,
    public base: Core,
    public fun: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doCong(
      this.target.toLazy(env),
      this.base.toLazy(env),
      this.fun.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(cong ${this.target.prettyPrint()} ${this.fun.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Symm extends Core {
  constructor(
    public equality: Core
  ) { super() }
  public valOf(env: Environment): V.Value {
    return Evaluator.doSymm(
      this.equality.toLazy(env)
    );
  }

  public prettyPrint(): string {
    return `(symm ${this.equality.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndEqual extends Core {
  
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIndEqual(
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(ind-= ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Vec extends Core {
  constructor(
    public type: Core,
    public length: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Vec(
      this.type.toLazy(env), 
      this.length.toLazy(env)
    );
  }

  public prettyPrint(): string {
    return `(Vec ${this.type.prettyPrint()} ${this.length.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class VecCons extends Core {

  constructor(
    public head: Core,
    public tail: Core
  ) { super() }


  public valOf(env: Environment): V.Value {
    return new V.VecCons(
      this.head.toLazy(env),
      this.tail.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(vec:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class VecNil extends Core {

  public valOf(env: Environment): V.Value {
    return new V.VecNil();
  }

  public prettyPrint(): string {
    return 'vecnil';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Head extends Core {

  constructor(
    public vec: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doHead(this.vec.toLazy(env));
  }

  public prettyPrint(): string {
    return `(head ${this.vec.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Tail extends Core {

  constructor(
    public vec: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doTail(this.vec.toLazy(env));
  }

  public prettyPrint(): string {
    return `(tail ${this.vec.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndVec extends Core {

  constructor(
    public length: Core,
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIndVec(
      this.length.toLazy(env),
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.base.toLazy(env),
      this.step.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `ind-Vec ${this.length.prettyPrint()}
              ${this.target.prettyPrint()}
              ${this.motive.prettyPrint()}
              ${this.base.prettyPrint()}
              ${this.step.prettyPrint()}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Either extends Core {

  constructor(
    public left: Core,
    public right: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Either(this.left.toLazy(env), this.right.toLazy(env));
  }

  public prettyPrint(): string {
    return `(Either ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
  
}

export class Left extends Core {

  constructor(
    public value: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Left(this.value.toLazy(env));
  }

  public prettyPrint(): string {
    return `(left ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Right extends Core {

  constructor(
    public value: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Right(this.value.toLazy(env));
  }

  public prettyPrint(): string {
    return `(right ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndEither extends Core {

  constructor(
    public target: Core,
    public motive: Core,
    public baseLeft: Core,
    public baseRight: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doIndEither(
      this.target.toLazy(env),
      this.motive.toLazy(env),
      this.baseLeft.toLazy(env),
      this.baseRight.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(ind-Either ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.baseLeft.prettyPrint()} 
              ${this.baseRight.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class TODO extends Core {
  constructor(
    public loc: SourceLocation,
    public type: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return new V.Neutral(
      this.type.toLazy(env),
      new N.TODO(this.loc, this.type.toLazy(env),)
    )
  }

  public prettyPrint(): string {
    return `TODO ${this.type.prettyPrint()}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Application extends Core {

  constructor(
    public fun: Core,
    public arg: Core
  ) { super() }

  public valOf(env: Environment): V.Value {
    return Evaluator.doApp(
      this.fun.toLazy(env),
      this.arg.toLazy(env),
    );
  }

  public prettyPrint(): string {
    return `(${this.fun.prettyPrint()} ${this.arg.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class VarName extends Core {

  constructor(
    public name: string
  ) { super() }

  public valOf(env: Environment): V.Value {
    if (isVarName(this.name)) {
      return getValueFromEnvironment(env, this.name);
    } else {
      throw new Error(`{this.name} is not a valid variable name`);
    }
  }

  public prettyPrint(): string {
    return this.name;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}