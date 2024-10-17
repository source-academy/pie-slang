/*
  ## Normalize.rkt ##
  This file implements normalization by evaluation.
*/

import {
  N_RecNat,
  N_Replace,
  N_Cdr,
  N_RecList,
  N_Head,
  N_Symm,
  N_Cong,
  Env,
  N_Ap,
  Core,
  Value,
  DELAY,
  DELAY_CLOS,
  Norm,
  Box,
  varVal,
  ctxToEnv,
  LAM,
  NEU,
  N_WhichNat,
  Closure,
  FO_CLOS,
  HO_CLOS,
  extendEnv,
  ADD1,
  PI,
  Ctx,
  SIGMA,
  CONS,
  QUOTE,
  LIST_CONS,
  LIST,
  EQUAL,
  SAME,
  VEC,
  VEC_CONS,
  EITHER,
  LEFT,
  RIGHT,
  isVarName,
  SerializableCtx,
  N_Car,
  Free,
  Def,
  Claim,
  N_IterNat,
  fresh,
  N_Trans1,
  N_Trans2,
  N_Trans12,
  bindFree,
  N_Tail,
  MetaMonad,
} from './basics'
import { locationToSrcLoc } from './locations';

/**
 *   ## Call-by-need evaluation ##

  Pie is a total language, which means that every program will
  eventually terminate. Because the steps taken during evaluation are
  completely deterministic, and because Pie is total, it is
  acceptable to choose any order of evaluation.

  On the other hand, many useful Pie programs will take many more
  evaluation steps to complete when using strict evaluation. For
  instance, consider zerop from chapter 3 of The Little Typer. zerop
  returns 'nil when its argument's value has add1 at the top, or 't
  if it is zero. If (zerop (double 10000)) is evaluated strictly, the
  evaluator will first need to find out that (double 10000) is 20000,
  requiring 10000 steps.  On the other hand, if it is evaluated
  lazily, then it will need only one step to discover that the value
  has add1 at the top.

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

function later(env: Env, expr: Core): Value {
  return new DELAY(new Box(new DELAY_CLOS(env, expr)));
}

// undelay is used to find the value that is contained in a
// DELAY-CLOS closure by invoking the evaluator.
function undelay(c: DELAY_CLOS): Value {
  return now(valOf(c.env, c.expr)!);
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
function now(v: Value): Value {
  if (v instanceof DELAY && v.val instanceof Box) {
    const content = v.val.contents;
    if (content instanceof DELAY_CLOS) {
      let theValue = undelay(content);
      v.val.contents = theValue;
      return theValue;
    }
    return content;
  }
  return v;
}

function getCoreType(expr: Core): String {
  if (expr instanceof String) {
    return expr;
  } else if (expr instanceof Symbol) {
    return expr.toString();
  } else {
    // if expr[0] is not a string then it must be 
    // a Core By definiton
    if (typeof expr[0] != 'string') {
      return "operation";
    } else {
      return expr[0];
    }
  }
}

// Helper for constructing nested Π types
function PIType([[argName, argType], ...next]: [Symbol, Value][], ret: Value): PI | Value {
  if ([argName, argType].length === 0) {
    return ret;
  } else {
    return new PI(argName, argType, new HO_CLOS((argName) => PIType(next, ret)));
  }
}


/*
  ## The evaluator ##

  Functions whose names begin with "do-" are helpers that implement
  the corresponding eliminator.
*/

function doAp(rator: Value, rand: Value): Value | undefined {
  const rtFin = now(rator);

  if (rtFin instanceof LAM) {
    return valOfClosure(rtFin.body, rand);
  }
  else if (rtFin instanceof NEU) {
    if (rtFin.type instanceof PI) {
      return new NEU(
        valOfClosure(rtFin.type.resultType, rand),
        new N_Ap(rtFin.neutral, new Norm(rtFin.type.argType, rand)));
    }
  }
}

function doWhichNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetFin = now(target);
  if (targetFin === 'ZERO') {
    return b;
  } else if (targetFin instanceof ADD1) {
    return doAp(s, new ADD1(targetFin.smaller));
  } else if (targetFin instanceof NEU) {
    if (targetFin.type === 'NAT') {
      return new NEU(
        b_t,
        new N_WhichNat(targetFin.neutral,
          new Norm(b_t, b),
          new Norm(PIType([[Symbol("n"), "NAT"]], b_t), s))
      );
    }
    return now(b_t);
  }
}


function doIterNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'ZERO') {
    return b;
  } else if (targetNow instanceof ADD1) {
    return doAp(s, doIterNat(targetNow.smaller, b_t, b, s)!);
  } else if (targetNow instanceof NEU) {
    if (targetNow.type === 'NAT') {
      return new NEU(
        b_t,
        new N_IterNat(targetNow.neutral,
          new Norm(b_t, b),
          new Norm(PIType([[Symbol("n"), b_t]], b_t), s))
      );
    }
  }
}


function doRecNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'ZERO') {
    return b;
  } else if (targetNow instanceof ADD1) {
    return doAp(
      doAp(s, targetNow.smaller)!,
      doRecNat(targetNow.smaller, b_t, b, s)!
    );
  } else if (targetNow instanceof NEU) {
    if (targetNow.type === 'NAT') {
      return new NEU(
        b_t,
        new N_RecNat(targetNow.neutral,
          new Norm(b_t, b),
          new Norm(PIType([[Symbol("n-1"), "NAT"],[Symbol("ih"), b_t]], b_t), s))
      );
    }
  }
}

function doIndNat(target: Value, mot: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'ZERO') {
    return b;
  } else if (targetNow instanceof ADD1) {
    return doAp(
      doAp(s, targetNow.smaller)!,
      doIndNat(targetNow.smaller, mot, b, s)!
    );
  } else if (targetNow instanceof NEU) {
    if (targetNow.type === 'NAT') {
      return new NEU(
        mot,
        new N_RecNat(targetNow.neutral,
          new Norm(mot, b),
          new Norm(PIType([[Symbol("n-1"), "NAT"],[Symbol("ih"), mot]], mot), s))
      );
    }
  }
}

function doCar(p: Value): Value | undefined {
  const nowP: Value = now(p);
  if (nowP instanceof CONS) {
    return nowP.car;
  } else if (nowP instanceof NEU) {
    const type = nowP.type;
    const neutral = nowP.neutral;
    if (!(neutral instanceof SIGMA)) {
      return undefined;
    }
    const A = neutral.carType;
    return new NEU(A, new N_Car(neutral));
  }
}

function doReplace(target: Value, mot: Value, b: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof SAME) {
    return b;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof EQUAL) {
      return new NEU(
        doAp(mot, targetNow.type.to)!,
        new N_Replace(
          targetNow.neutral,
          new Norm(PIType([[Symbol("x"), targetNow.type.type]], "UNIVERSE"), mot),
          new Norm(doAp(mot, targetNow.type.from)!, b)
        )
      );
    }
  }
}

function doTrans(target1: Value, target2: Value): Value | undefined {
  const target1Now = now(target1);
  const target2Now = now(target2);
  if (target1Now instanceof SAME && target2Now instanceof SAME) {
    return new SAME(target1Now.value);
  } else if (target1Now instanceof SAME && target2Now instanceof NEU) {
    if (target2Now.type instanceof EQUAL) {
      return new NEU(
        new EQUAL(target2Now.type.type, target1Now.value, target2Now.type.to),
        new N_Trans2(
          new Norm(
            new EQUAL(target2Now.type.type, target1Now.value, target1Now.value),
            new SAME(target1Now.value)
          ),
          target2Now.neutral
        )
      );
    }
  } else if (target1Now instanceof NEU && target2Now instanceof SAME) {
    if (target1Now.type instanceof EQUAL) {
      return new NEU(
        new EQUAL(target1Now.type.type, target1Now.type.from, target2Now.value),
        new N_Trans1(
          target1Now.neutral,
          new Norm(
            new EQUAL(target1Now.type.type, target2Now.value, target2Now.value),
            new SAME(target2Now.value)
          )
        )
      );
    }
  } else if (target1Now instanceof NEU && target2Now instanceof NEU) {
    if (target1Now.type instanceof EQUAL && target2Now.type instanceof EQUAL) {
      return new NEU(
        new EQUAL(target1Now.type.type, target1Now.type.from, target2Now.type.to),
        new N_Trans12(
          target1Now.neutral,
          target2Now.neutral
        )
      );
    }
  }
}

function doCong(target: Value, B: Value, fun: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof SAME) {
    return new SAME(doAp(fun, targetNow.value)!);
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof EQUAL) {
      return new NEU(
        new EQUAL(B, doAp(fun, targetNow.type.from)!, doAp(fun, targetNow.type.to)!),
        new N_Cong(
          targetNow.neutral,
          new Norm(PIType([[Symbol("x"), targetNow.type.type]], B), fun)
        )
      );
    }
  }
}

function doSymm(target: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof SAME) {
    return new SAME(targetNow.value);
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof EQUAL) {
      return new NEU(
        new EQUAL(targetNow.type.type, targetNow.type.to, targetNow.type.from),
        new N_Symm(targetNow.neutral)
      );
    }
  }
}

function doIndEqual(target: Value, mot: Value, base: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof SAME) {
    return base;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof EQUAL) {
      return new NEU(
        mot,
        new N_Replace(
          targetNow.neutral,
          new Norm(PIType([[Symbol("x"), targetNow.type.type]], "UNIVERSE"), mot),
          new Norm(doAp(mot, targetNow.type.from)!, base)
        )
      );
    }
  }
}

function doHead(target: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof VEC_CONS) {
    return targetNow.head;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof VEC) {
      if (targetNow.type.length instanceof ADD1) {
        return new NEU(
          targetNow.type.entryType,
          new N_Head(targetNow.neutral)
        );
      }
    }
  }
}

function doTail(target: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof VEC_CONS) {
    return targetNow.tail;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof VEC) {
      if (targetNow.type.length instanceof ADD1) {
        return new NEU(
          new VEC(targetNow.type.entryType, targetNow.type.length.smaller),
          new N_Tail(targetNow.neutral)
        );
      }
    }
  }
}

function indVecStepType(Ev: Value, mot: Value): Value {
  let k = new MetaMonad<"NAT">(null, Symbol("k"));
  let es = new VEC(Ev, k);
  return PIType(
    [[k.getName(), "NAT"], [Symbol("e"), Ev], [Symbol("es"), es] , [Symbol("ih"), doAp(doAp(mot, k)!, es)!]],
    doAp(doAp(mot, new ADD1(k))!, new VEC_CONS(Ev, es))!
  )
}

function doIndVec(len: Value, vec: Value, mot: Value, base: Value, step: Value): Value | undefined {
  const lenNow = now(len);
  const vecNow = now(vec);
  if(lenNow === 'ZERO' && vecNow === 'VECNIL') {  
    return base;
  } else if (lenNow instanceof ADD1 && vecNow instanceof VEC_CONS) {
    return doAp(
      doAp(
        doAp(
          doAp(step, lenNow.smaller)!,
          vecNow.head
        )!,
        doTail(vecNow)!
      )!,
      doIndVec(lenNow.smaller, vecNow.tail, mot, base, step)!
    )!;
  }
}

function valOf(env: Env, expr: Core): Value | undefined {
  return undefined;
  /*
  switch (getCoreType(expr)) {
    case 'The':
      return valOf(env, expr[2]);
    case 'U':
      return 'UNIVERSE';
    case 'Nat':
      return 'NAT';
    case 'Zero':
      return 'ZERO';
    case 'Add1':
      return new ADD1(later(env, expr[1]));
    case 'Π':
      const arr = expr[1];
      let A_v = later(env, arr[0][1]);
      return new PI(arr[0][0], A_v, new FO_CLOS(env, arr[0][0], expr[2]));
    case 'Lambda':
      return new LAM(expr[1][0], new FO_CLOS(env, expr[1][0], expr[2]));
    case 'WhichNat':
      return doWhichNat(
        later(env, expr.target),
        later(env, expr.b_t),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'IterNat':
      return doIterNat(
        later(env, expr.target),
        later(env, expr.b_t),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'RecNat':
      return doRecNat(
        later(env, expr.target),
        later(env, expr.b_t),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'IndNat':
      return doIndNat(
        later(env, expr.target),
        later(env, expr.mot),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'Atom':
      return 'ATOM';
    case 'Sigma':
      const pair = expr[1][0];
      let A_v_Sigma = later(env, pair[1]);
      return new SIGMA(pair[0], A_v_Sigma, new FO_CLOS(env, pair[0], expr[2]));
    case 'Cons':
      return new CONS(later(env, expr[1]), later(env, expr[2]));
    case 'Car':
      return doCar(later(env, expr.p));
    case 'Cdr':
      return doCdr(later(env, expr.p));
    case 'Quote':
      if (typeof expr[1] === 'symbol') {
        return new QUOTE(expr[1]);
      }
      break;
    case 'Trivial':
      return 'TRIVIAL';
    case 'Sole':
      return 'SOLE';
    case 'Nil':
      return 'NIL';
    case '::':
      return new LIST_CONS(later(env, expr[1]), later(env, expr[2]));
    case 'List':
      return new LIST(later(env, expr[1]));
    case 'IndList':
      return doIndList(
        later(env, expr.target),
        later(env, expr.mot),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'RecList':
      return doRecList(
        later(env, expr.target),
        later(env, expr.b_t),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'Absurd':
      return 'ABSURD';
    case 'IndAbsurd':
      return doIndAbsurd(later(env, expr.target), later(env, expr.mot));
    case 'Equal':
      return new EQUAL(
        later(env, expr[1]),
        later(env, expr[2]),
        later(env, expr[3])
      );
    case 'Same':
      return new SAME(later(env, expr[1]));
    case 'Replace':
      return doReplace(
        later(env, expr.target),
        later(env, expr.mot),
        later(env, expr.b)
      );
    case 'Trans':
      return doTrans(later(env, expr.p1), later(env, expr.p2));
    case 'Cong':
      return doCong(
        later(env, expr.p1),
        later(env, expr.p2),
        later(env, expr.p3)
      );
    case 'Symm':
      return doSymm(later(env, expr.p));
    case 'IndEqual':
      return doIndEqual(
        later(env, expr.target),
        later(env, expr.mot),
        later(env, expr.b)
      );
    case 'Vec':
      return new VEC(later(env, expr[1]), later(env, expr[2]));
    case 'VecNil':
      return 'VECNIL';
    case 'VecCons':
      return new VEC_CONS(later(env, expr[1]), later(env, expr[2]));
    case 'Head':
      return doHead(later(env, expr.es));
    case 'Tail':
      return doTail(later(env, expr.es));
    case 'IndVec':
      return doIndVec(
        later(env, expr.len),
        later(env, expr.es),
        later(env, expr.mot),
        later(env, expr.b),
        later(env, expr.s)
      );
    case 'Either':
      return new EITHER(later(env, expr[1]), later(env, expr[2]));
    case 'Left':
      return new LEFT(later(env, expr[1]));
    case 'Right':
      return new RIGHT(later(env, expr[1]));
    case 'IndEither':
      return doIndEither(
        later(env, expr.target),
        later(env, expr.mot),
        later(env, expr.l),
        later(env, expr.r)
      );
    case 'Apply':
      return doAp(later(env, expr.rator), later(env, expr.rand));
    case 'TODO':
      return NEU(later(env, expr.type), NTODO(expr.where, later(env, expr.type)));
    case 'Trivial':
      return 'TRIVIAL';
    default:
      if (typeof expr === 'string' && isVarName(Symbol(expr))) {
        return varVal(env, Symbol(expr));
      }
      throw new Error(`No evaluator for ${expr}`);
  }
  */
}

/*
  General-purpose helpers

  Given a value for a closure's free variable, find the value. This
  cannot be used for DELAY-CLOS, because DELAY-CLOS's laziness
  closures do not have free variables, but are instead just delayed
  computations.
*/
function valOfClosure(c: Closure, v: Value): Value {
  if (c instanceof FO_CLOS) {
    return valOf(extendEnv(c.env, c.varName, v), c.expr);
  } else if (c instanceof HO_CLOS) {
    return c.proc(v);
  }
  return v;
}
/*
  Find the value of an expression in the environment that
  corresponds to a context.
*/
function valInCtx(context: Ctx, core: Core): Value {
  return valOf(ctxToEnv(context), core);
}

function read_back_context(context: Ctx): SerializableCtx | undefined{
  if (context === null) {
    return context;
  } else {
    const [[x, binding], ...rest] = context;
    if (binding instanceof Free) {
      const serialfree = [Symbol('free'), read_back_type]
    }
  }
}

function read_back_type(context: Ctx, value: Value): Core | undefined{
  if (value instanceof String) {
    switch (value) {
      case 'UNIVERSE':
        return 'U';
      case 'NAT':
        return 'Nat';
      case 'ATOM':
        return 'Atom';
      case 'TRIVIAL':
        return 'Trivial';
      case 'ABSURD':
        return 'Absurd';
    }
   } else if (value instanceof PI) {
      let A_e = read_back_type(context, value.argType);
      let x_hat = fresh(context, value.argName);
      let ex_x_hat = bindFree(context, x_hat, value.argType);
    }
  } 
