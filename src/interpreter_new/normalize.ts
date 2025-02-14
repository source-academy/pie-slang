/*
  ## Normalize.rkt ##
  This file implements normalization by evaluation.
*/

import util from 'util';
import { P } from 'ts-pattern';
import * as C from './types/core'
import * as S from "./types/source"
import * as V from "./types/value"
import * as N from "./types/neutral"
import { locationToSrcLoc } from './locations';
import { contextToEnvironment, Environment, extendEnvironment } from './types/environment';
import { Closure, FirstOrderClosure, HigherOrderClosure } from './types/utils';
import { Context } from './types/contexts';


/**
 *   ## Call-by-need evaluation ##

  Pie is a total language, which means that every program will
  eventually terminate. Because the steps taken during evaluation are
  completely deterministic, and because Pie is total, it is
  acceptable to choose any order of evaluation.

  On the other hand, many useful Pie programs will take many more
  evaluation steps to complete when using strict evaluation. For
  instance, consider zerop from chapter 3 of The Little Typer. zerop
  returns 'nil when its argument's value has V_Add1 at the top, or 't
  if it is zero. If (zerop (double 10000)) is evaluated strictly, the
  evaluator will first need to find out that (double 10000) is 20000,
  requiring 10000 steps.  On the other hand, if it is evaluated
  lazily, then it will need only one step to discover that the value
  has V_Add1 at the top.

  Pie uses call-by-need evaluation. This means that if two different
  expressions make use of some expression, such as a definition, then
  evaluation steps will be shared between them and will not need to
  be repeated.

  Call-by-need evaluation is achieved by introducing a new value that
  represents evaluation that has not yet been performed, but should
  instead be performed on demand. That value, which doesn't represent
  any value in the Pie sense of the word, is called DELAY and is
  defined in basics.rkt. When DELAY represents work that has not yet
  been done, it is filled with a special kind of closure called
  DELAY-CLOS that pairs an expression with its environment.

  Not every DELAY represents evaluation that has not yet been
  performed. Some represent evaluation that was already demanded by
  some other operator. The work is shared by updating the contents of
  DELAY with an actual value.

  later is used to delay evaluation by constructing a DELAY value
  that contains a DELAY-CLOS closure.
*/

export function later(env: Environment, expr: C.Core): V.Value {
  return new V.Delay(new V.Box(new V.DelayClosure(env, expr)));
}

// undelay is used to find the value that is contained in a
// DELAY-CLOS closure by invoking the evaluator.
export function undelay(c: V.DelayClosure): V.Value {
  return now(c.expr.valOf(c.env));
}


/*
  now demands the _actual_ value represented by a DELAY. If the value
  is a DELAY-CLOS, then it is computed using undelay. If it is
  anything else, then it has already been computed, so it is
  returned.
  
  now should be used any time that a value is inspected to see what
  form it has, because those situations require that the delayed
  evaluation steps be carried out.
*/
function now(todo: V.Value): V.Value {
  if (todo instanceof V.Delay) { //todo.val is nessarily a Box
    const box = todo.val;
    const content = box.get();
    if (content instanceof V.DelayClosure) {
      let theValue = undelay(content);
      box.set(theValue);
      return theValue;
    }
    return box.get();
  }
  return todo;
}

/*
  ### The evaluator ###

  Functions whose names begin with "do-" are helpers that implement
  the corresponding eliminator.
*/
function doApp(operator: V.Value, operand: V.Value): V.Value | undefined {
  const operatorNow = now(operator);
  if (operatorNow instanceof V.Lambda) {
    return valOfClosure(operatorNow.body, operand);
  }
  else if (operatorNow instanceof V.Neutral) {
    if (operatorNow.type instanceof V.Pi) {
      return new V.Neutral(
        valOfClosure(operatorNow.type.resultType, operand)!,
        new N.Application(
          operatorNow.neutral,
          new N.Norm(operatorNow.type.argType, operand)
        )
      );
    }
  }
}

function doWhichNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(step, targetNow.smaller);
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.Nat) {
    return new V.Neutral(
      baseType,
      new N.WhichNat(
        targetNow.neutral,
        new N.Norm(baseType, base),
        new N.Norm(
          new V.Pi(
            "n",
            new V.Nat(),
            new HigherOrderClosure((_) => baseType)),
          step)
      )
    );
  }
}

function doIterNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      step,
      doIterNat(targetNow.smaller, baseType, base, step)!
    );
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.Nat) {
    return new V.Neutral(baseType, new N.IterNat(
      targetNow.neutral,
      new N.Norm(baseType, base),
      new N.Norm(
        new V.Pi(
          "n",
          new V.Nat(),
          new HigherOrderClosure((_) => baseType)),
        step)
    ));
  }
}

function doRecNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      step,
      doRecNat(targetNow.smaller, baseType, base, step)!
    );
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.Nat) {
    return new V.Neutral(baseType, new N.RecNat(
      targetNow.neutral,
      new N.Norm(baseType, base),
      new N.Norm(
        new V.Pi(
          "n-1",
          new V.Nat(),
          new HigherOrderClosure(
            (_) => new V.Pi(
              "ih",
              baseType,
              new HigherOrderClosure(
                (_) => baseType
              )
            )
          )
        ),
        step
      )
    ));
  }
}

function doIndNat(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      doApp(step, targetNow.smaller)!,
      doIndNat(targetNow.smaller, motive, base, step)!
    );
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.Nat) {
    return new V.Neutral(
      doApp(motive, target)!,
      new N.IndNat(
        targetNow.neutral,
        new N.Norm(new V.Pi(
          "x",
          new V.Nat(),
          new HigherOrderClosure((_) => new V.Universe())
        ), motive),
        new N.Norm(doApp(motive, new V.Zero())!, base),
        new N.Norm(
          new V.Pi(
            "n-1",
            new V.Nat(),
            new HigherOrderClosure(
              (n_minus_1) =>
                new V.Pi(
                  "ih",
                  doApp(motive, n_minus_1)!,
                  new HigherOrderClosure(
                    (_) => doApp(motive, new V.Add1(n_minus_1))!
                  )
                )
            )
          ), step
        )
      )
    );
  }
}


function doCar(p: V.Value): V.Value | undefined {
  const pairNow: V.Value = now(p);
  if (pairNow instanceof V.Cons) {
    return pairNow.car;
  } else if (pairNow instanceof V.Neutral &&
    pairNow.type instanceof V.Sigma) {
    const sigma = pairNow.type;
    const neutral = pairNow.neutral;
    return new V.Neutral(sigma.carType, new N.Car(neutral));
  }
}


function doCdr(pair: V.Value): V.Value | undefined {
  const pairNow: V.Value = now(pair);
  if (pairNow instanceof V.Cons) {
    return pairNow.car;
  } else if (pairNow instanceof V.Neutral &&
    pairNow.type instanceof V.Sigma) {
    const sigma = pairNow.type;
    const neutral = pairNow.neutral;
    return new V.Neutral(
      valOfClosure(sigma.cdrType, doCar(pair)!)!,
      new N.Cdr(neutral)
    )
  }
}


function doIndList(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Nil) {
    return base;
  } else if (targetNow instanceof V.ListCons) {
    return doApp(
      doApp(
        doApp(
          step,
          targetNow.head
        )!,
        targetNow.tail
      )!,
      doIndList(targetNow.tail, motive, base, step)!
    );
  } else if (targetNow instanceof V.Neutral && targetNow.type instanceof V.List) {
    const entryType = targetNow.type.entryType;
    const neutral = targetNow.neutral;
    const motiveType = new V.Pi(
      "xs",
      new V.List(entryType),
      new HigherOrderClosure((xs) => new V.Universe())
    );
    return new V.Neutral(
      doApp(motive, target)!,
      new N.IndList(
        neutral,
        new N.Norm(motiveType, motive),
        new N.Norm(doApp(motive, new V.Nil())!, base),
        new N.Norm(
          new V.Pi(
            "h",
            entryType,
            new HigherOrderClosure((h) =>
              new V.Pi(
                "t",
                new V.List(entryType),
                new HigherOrderClosure((t) =>
                  new V.Pi(
                    "ih",
                    doApp(motive, t)!,
                    new HigherOrderClosure((_) =>
                      doApp(motive, new V.ListCons(h, t))!
                    )
                  )
                )
              )
            )
          ),
          step
        )
      )
    );
  }
}

function doRecList(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Nil) {
    return base;
  } else if (targetNow instanceof V.ListCons) {
    const head = targetNow.head;
    const tail = targetNow.tail;
    return doApp(
      doApp(
        doApp(step, head)!,
        tail)!,
      doRecList(tail, baseType, base, step)!
    )!;
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.List) {
    const entryType = targetNow.type.entryType;
    const neutral = targetNow.neutral;
    return new V.Neutral(
      baseType,
      new N.RecList(
        neutral,
        new N.Norm(baseType, base),
        new N.Norm(
          new V.Pi(
            "h",
            entryType,
            new HigherOrderClosure((h) =>
              new V.Pi(
                "t",
                new V.List(entryType),
                new HigherOrderClosure((t) =>
                  new V.Pi(
                    "ih",
                    baseType,
                    new HigherOrderClosure((_) =>
                      baseType,
                    )
                  )
                )
              )
            )
          ),
          step
        ),
      )
    );
  }
}


function doIndAbsurd(target: V.Value, motive: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Absurd) {
    return new V.Neutral(
      motive,
      new N.IndAbsurd(
        targetNow.neutral,
        new N.Norm(new V.Universe(), motive)
      )
    );
  }
}


function doReplace(target: V.Value, motive: V.Value, base: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Same) {
    return base;
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Equal) {
    const neutral = targetNow.neutral;
    const eqType = targetNow.type.type;
    const from = targetNow.type.from;
    const to = targetNow.type.to;
    return new V.Neutral(
      doApp(motive, to)!,
      new N.Replace(
        neutral,
        new N.Norm(
          new V.Pi(
            "x",
            eqType,
            new HigherOrderClosure((x) => new V.Universe())
          ),
          motive
        ),
        new N.Norm(doApp(motive, from)!, base)
      )
    );
  }
}


function doTrans(target1: V.Value, target2: V.Value): V.Value | undefined {
  const target1Now = now(target1);
  const target2Now = now(target2);
  if (target1Now instanceof V.Same && target2Now instanceof V.Same) {
    return new V.Same(target1Now.value);
  } else if (target1Now instanceof V.Same &&
    (target2Now instanceof V.Neutral && target2Now.type instanceof V.Equal)) {
    const from = target1Now.value;
    const to = target2Now.type.to;
    const eqType = target2Now.type.type;
    const neutral2 = target2Now.neutral;
    return new V.Neutral(
      new V.Equal(eqType, from, to),
      new N.Trans2(
        new N.Norm(
          new V.Equal(eqType, from, from),
          new V.Same(from)
        ),
        neutral2
      )
    )
  } else if ((target1Now instanceof V.Neutral && target1Now.type instanceof V.Equal)
    && target2Now instanceof V.Same) {
    const from = target1Now.type.from;
    const to = target2Now.value;
    const eqType = target1Now.type.type;
    const neutral1 = target1Now.neutral;
    return new V.Neutral(
      new V.Equal(eqType, from, to),
      new N.Trans1(
        neutral1,
        new N.Norm(
          new V.Equal(eqType, to, to),
          new V.Same(to)
        )
      )
    );
  } else if (
    (target1Now instanceof V.Neutral && target1Now.type instanceof V.Equal) &&
    (target2Now instanceof V.Neutral && target2Now.type instanceof V.Equal)) {
    const from = target1Now.type.from;
    const to = target2Now.type.to;
    const eqType = target1Now.type.type;
    const neutral1 = target1Now.neutral;
    const neutral2 = target2Now.neutral;
    return new V.Neutral(
      new V.Equal(eqType, from, to),
      new N.Trans12(neutral1, neutral2)
    );
  }
}


function doCong(target: V.Value, base: V.Value, func: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Same) {
    return new V.Same(doApp(func, targetNow.value)!);
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Equal) {
    const eqType = targetNow.type.type;
    const from = targetNow.type.from;
    const to = targetNow.type.to;
    const neutral = targetNow.neutral;
    return new V.Neutral(
      new V.Equal(
        base,
        doApp(func, from)!,
        doApp(func, to)!
      ),
      new N.Cong(
        neutral,
        new N.Norm(
          new V.Pi(
            "x",
            eqType,
            new HigherOrderClosure((x) => base)
          ),
          func
        )
      )
    );
  }
}

function doSymm(target: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Same) {
    return new V.Same(targetNow.value);
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Equal) {
    return new V.Neutral(
      new V.Equal(
        targetNow.type.type,
        targetNow.type.to,
        targetNow.type.from
      ),
      new N.Symm(targetNow.neutral)
    );
  }
}


function doIndEqual(target: V.Value, motive: V.Value, base: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Same) {
    return base;
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.Equal) {
    const eqType = targetNow.type.type;
    const from = targetNow.type.from;
    const to = targetNow.type.to;
    const neutral = targetNow.neutral;
    return new V.Neutral(
      doApp(doApp(motive, to)!, target)!,
      new N.IndEq(
        neutral,
        new N.Norm(
          new V.Pi(
            "to",
            eqType,
            new HigherOrderClosure(
              (to) => new V.Pi(
                "p",
                new V.Equal(eqType, from, to),
                new HigherOrderClosure(
                  (_) => new V.Universe()
                )
              )
            )
          ),
          motive
        ),
        new N.Norm(
          doApp(doApp(motive, from)!, new V.Same(from))!,
          base
        )
      )
    );
  }
}


function doHead(target: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.VecCons) {
    return targetNow.head;
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Vec &&
    targetNow.type.length instanceof V.Add1) {
    return new V.Neutral(
      targetNow.type.entryType,
      new N.Head(targetNow.neutral)
    );
  }
}


function doTail(target: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.VecCons) {
    return targetNow.tail;
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Vec &&
    targetNow.type.length instanceof V.Add1) {
    return new V.Neutral(
      new V.Vec(
        targetNow.type.entryType,
        targetNow.type.length.smaller
      ),
      new N.Tail(targetNow.neutral)
    );
  }
}


function indVecStepType(Ev: V.Value, mot: V.Value): V.Value {
  return new V.Pi(
    "k",
    new V.Nat(),
    new HigherOrderClosure(
      (k) => new V.Pi(
        "e",
        new V.Vec(Ev, k),
        new HigherOrderClosure(
          (e) => new V.Pi(
            "es",
            new V.Vec(Ev, k),
            new HigherOrderClosure(
              (es) => new V.Pi(
                "ih",
                doApp(doApp(mot, k)!, es)!,
                new HigherOrderClosure(
                  (_) =>
                    doApp(
                      doApp(mot, new V.Add1(k))!,
                      new V.VecCons(e, es)
                    )!
                )
              )
            )
          )
        )
      )
    )
  );
}

function doIndV_Vec(len: V.Value, vec: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value | undefined {
  const lenNow = now(len);
  const vecNow = now(vec);
  if (lenNow instanceof V.Zero && vecNow instanceof V.VecNil) {
    return base;
  } else if (lenNow instanceof V.Add1 && vecNow instanceof V.VecCons) {
    return doApp(
      doApp(
        doApp(
          doApp(step, lenNow.smaller)!,
          vecNow.head
        )!,
        doTail(vec)!
      )!,
      doIndV_Vec(
        lenNow.smaller,
        vecNow.tail,
        motive,
        base,
        step
      )!
    )!;
  } else if (lenNow instanceof V.Neutral && vecNow instanceof V.Neutral
    && lenNow.type instanceof V.Nat && vecNow.type instanceof V.Vec) {
    const entryType = vecNow.type.entryType;
    return new V.Neutral(
      doApp(doApp(motive, len)!, vec)!,
      new N.IndVec12(
        lenNow.neutral,
        vecNow.neutral,
        new N.Norm(
          new V.Pi(
            "k",
            new V.Nat(),
            new HigherOrderClosure(
              (k) => new V.Pi(
                "es",
                new V.Vec(entryType, k),
                new HigherOrderClosure(
                  (_) => new V.Universe()
                )
              )
            )
          ),
          motive
        ),
        new N.Norm(
          doApp(
            doApp(motive, new V.Zero)!, V.VecNil
          )!,
          base
        ),
        new N.Norm(
          indVecStepType(
            vecNow.type.entryType, motive), step)
      )
    );

  } else if (natEqual(lenNow, len) && vecNow instanceof V.Neutral && vecNow.type instanceof V.Vec) {
    const entryType = vecNow.type.entryType;
    return new V.Neutral(
      doApp(doApp(motive, len)!, vec)!,
      new N.IndVec2(
        new N.Norm(new V.Nat(), len),
        vecNow.neutral,
        new N.Norm(
          new V.Pi(
            "k",
            new V.Nat(),
            new HigherOrderClosure(
              (k) => new V.Pi(
                "es",
                new V.Vec(entryType, k),
                new HigherOrderClosure(
                  (_) => new V.Universe()
                )
              )
            )
          ),
          motive
        ),
        new N.Norm(
          doApp(
            doApp(motive, new V.Nat())!,
            new V.VecNil
          )!, 
        base),
        new N.Norm(
          indVecStepType(
            entryType, motive
          ),
          step
        ),
      )
    );
  }
}

/*
  The function doIndVec is a helper for the inductive definition of
  natural numbers. It is used to implement the induction step.
*/

function natEqual(nat1: V.Value, nat2: V.Value): boolean {
  const nat1Now = now(nat1);
  const nat2Now = now(nat2);
  if (nat1Now instanceof V.Zero && nat2Now instanceof V.Zero) {
    return true;
  } else if (nat1Now instanceof V.Add1 && nat2Now instanceof V.Add1) {
    return natEqual(nat1Now.smaller, nat2Now.smaller);
  } else {
    return false;
  }
}

function doIndEither(target: V.Value, motive: V.Value, left: V.Value, right: V.Value): V.Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V.Left) {
    return doApp(left, targetNow.value);
  } else if (targetNow instanceof V.Right) {
    return doApp(right, targetNow.value);
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Either) {
    const leftType = targetNow.type.leftType;
    const rightType = targetNow.type.rightType;
    const motiveType = new V.Pi(
      "x",
      new V.Either(leftType, rightType),
      new HigherOrderClosure((x) => new V.Universe())
    )
    return new V.Neutral(
      doApp(motive, target)!,
      new N.IndEither(
        targetNow.neutral,
        new N.Norm(motiveType, motive),
        new N.Norm(
          new V.Pi(
            "x",
            leftType,
            new HigherOrderClosure((x) => doApp(motive, new V.Left(x))!)
          ),
          left
        ),
        new N.Norm(
          new V.Pi(
            "x",
            rightType,
            new HigherOrderClosure((x) => doApp(motive, new V.Right(x))!)
          ),
          right
        )
      )
    )
  }
}

/*
  General-purpose helpers
 
  Given a value for a closure's free variable, find the value. This
  cannot be used for DELAY-CLOS, because DELAY-CLOS's laziness
  closures do not have free variables, but are instead just delayed
  computations.
*/
function valOfClosure(c: Closure, v: V.Value): V.Value | undefined {
  if (c instanceof FirstOrderClosure) {
    return c.expr.valOf(extendEnvironment(c.env, c.varName, v));
  } else if (c instanceof HigherOrderClosure) {
    return c.proc(v);
  }
  return v;
}

/*
  Find the value of an expression in the environment that
  corresponds to a context.
*/
function valInCtx(context: Context, core: C.Core): V.Value | undefined {
  return core.valOf(contextToEnvironment(context));
}
