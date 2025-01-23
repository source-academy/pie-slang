/*
  ## Normalize.rkt ##
  This file implements normalization by evaluation.
*/

import util from 'util';
import { P } from 'ts-pattern';
import {
  Env, N_Ap, Core, Value, DELAY, DELAY_CLOS, Norm, Box, varVal, ctxToEnv, LAM, NEU, N_RecNat, N_IndAbsurd, N_WhichNat,
  N_IndEither, N_IndVec1, N_IndVec2, N_IndVec12, N_Cong, N_IndNat, N_Trans1, N_Trans2, N_Trans12, Closure, FO_CLOS, HO_CLOS,
  extendEnv, N_RecList, ADD1, PI, Ctx, SIGMA, CONS, QUOTE, LIST_CONS, LIST, EQUAL, SAME, VEC, VEC_CONS, EITHER, LEFT, RIGHT,
  isVarName, SerializableCtx, N_Car, N_Cdr, N_IndList, N_Replace, Free, Def, Claim, N_IterNat, fresh, N_IndEq, bindFree,
  MetaVar, N_Head, N_Tail, N_Var, N_Symm, Neutral, N_TODO,
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

function PIType(arglist: [Symbol, Value][], ret: Value): PI | Value {
  if (arglist.length === 0) {
    return ret;
  } else {
    const [argName, argType] = arglist[0];
    return new PI(argName, argType, new HO_CLOS((x) => PIType(arglist.slice(1), ret)));
  }
}


function doAp(rator: Value, rand: Value): Value | undefined {
  const rtFin = now(rator);

  if (rtFin instanceof LAM) {
    return valOfClosure(rtFin.body, rand);
  }
  else if (rtFin instanceof NEU) {
    if (rtFin.type instanceof PI) {
      return new NEU(
        valOfClosure(rtFin.type.resultType, rand)!,
        new N_Ap(rtFin.neutral, new Norm(rtFin.type.argType, rand)));
    }
  }
}

function doWhichNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetFin = now(target);
  if (targetFin === 'ZERO') {
    return b;
  } else if (targetFin instanceof ADD1) {
    return doAp(s, targetFin.smaller);
  } else if (targetFin instanceof NEU) {
    if (targetFin.type === 'NAT') {
      const n = new MetaVar(null, "NAT", Symbol("n"));
      return new NEU(
        b_t,
        new N_WhichNat(
          targetFin.neutral,
          new Norm(b_t, b),
          new Norm(PIType([[n.name, n.varType]], b_t), s)
        )
      );
    }
    return now(b_t);
  }
}

function doIterNat(target: Value, bVType: Value, bV: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'ZERO') {
    return bV;
  } else if (targetNow instanceof ADD1) {
    const nMinusOne = targetNow.smaller;
    return doAp(s, doIterNat(nMinusOne, bVType, bV, s)!);
  } else if (targetNow instanceof NEU) {
    if (targetNow.type !== 'NAT') {
      return undefined;
    }
    const n = new MetaVar(null, "NAT", Symbol("n"));
    const neutral = targetNow.neutral;
    return new NEU(bVType, new N_IterNat(neutral,
      new Norm(bVType, bV),
      new Norm(PIType([[n.name, n.varType]], bVType), s))
    );
  }
}

function doRecNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'ZERO') {
    return b;
  } else if (targetNow instanceof ADD1) {
    const nMinusOne = targetNow.smaller;
    return doAp(s, new ADD1(nMinusOne));
  } else if (targetNow instanceof NEU) {
    if (targetNow.type !== 'NAT') {
      return undefined;
    }
    const n_smaller = new MetaVar(null, "NAT", Symbol("n-1"));
    const ih = new MetaVar(null, b_t, Symbol("ih"));
    const neutral = targetNow.neutral;
    return new NEU(b_t, new N_RecNat(neutral,
      new Norm(b_t, b),
      new Norm(PIType(
        [
          [n_smaller.name, n_smaller.varType],
          [ih.name, ih.varType],
        ], b_t), s))
    );
  }
}

function doIndNat(target: Value, mot: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === "ZERO") {
    return b;
  } else if (targetNow instanceof ADD1) {
    const nMinusOne = targetNow.smaller;
    return doAp(s, new ADD1(nMinusOne));
  } else if (targetNow instanceof NEU) {
    if (targetNow.type === 'NAT') {
      const n_smaller = new MetaVar(null, "NAT", Symbol("n-1"));
      const x = new MetaVar(null, "NAT", Symbol("x"));
      const ih = new MetaVar(null, doAp(mot, n_smaller)!, Symbol("ih"));
      return new NEU(
        doAp(mot, target)!,
        new N_IndNat(
          targetNow.neutral,
          new Norm(PIType([[x.name, x.varType]], 'UNIVERSE'), mot),
          new Norm(doAp(mot, 'ZERO')!, b),
          new Norm(
            PIType([
              [x.name, x.varType],
              [ih.name, ih.varType],
            ], doAp(mot, new ADD1(n_smaller))!),
            s
          )
        )
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


function doCdr(p: Value): Value | undefined {
  const nowP: Value = now(p);
  if (nowP instanceof CONS) {
    return nowP.cdr;
  } else if (nowP instanceof NEU) {
    const type = nowP.type;
    const neutral = nowP.neutral;
    if (!(neutral instanceof SIGMA)) {
      return undefined;
    }
    return new NEU(valOfClosure(neutral.cdrType, doCar(nowP)!)!, new N_Cdr(neutral));
  }
}

function doIndList(target: Value, mot: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'NIL') {
    return b;
  } else if (targetNow instanceof LIST_CONS) {
    const h = targetNow.head;
    const t = targetNow.tail;
    return doAp(
      doAp(doAp(s, h)!, t)!,
      doIndList(t, mot, b, s)!
    )!;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof LIST) {
      const E = targetNow.type.entryType;
      const ne = targetNow.neutral;

      const xs = new MetaVar(null, new LIST(E), Symbol("xs"));
      const h = new MetaVar(null, E, Symbol("h"));
      const t = new MetaVar(null, new LIST(E), Symbol("t"));
      const ih = new MetaVar(null, doAp(mot, t)!, Symbol("ih"));

      const motTv = PIType([[xs.name, xs.varType]], 'UNIVERSE');
      return new NEU(
        doAp(mot, target)!,
        new N_IndList(
          ne,
          new Norm(motTv, mot),
          new Norm(doAp(mot, 'NIL')!, b),
          new Norm(
            PIType([
              [h.name, h.varType],
              [t.name, t.varType],
              [t.name, t.varType]
            ], doAp(mot, new LIST_CONS(h, t)!)!),
            s
          )
        ));
    }
  }
}

function doRecList(target: Value, bt: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'NIL') {
    return b;
  } else if (targetNow instanceof LIST_CONS) {
    const h = targetNow.head;
    const t = targetNow.tail;
    return doAp(
      doAp(doAp(s, h)!, t)!,
      doRecList(t, bt, b, s)!
    )!;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof LIST) {
      const E = targetNow.type.entryType;
      const ne = targetNow.neutral;

      const h = new MetaVar(null, E, Symbol("h"));
      const t = new MetaVar(null, new LIST(E), Symbol("t"));
      const ih = new MetaVar(null, doAp(bt, t)!, Symbol("ih"));

      return new NEU(
        bt,
        new N_RecList(
          ne,
          new Norm(bt, b),
          new Norm(PIType([
            [h.name, h.varType],
            [t.name, t.varType],
            [ih.name, ih.varType],
          ], bt), s),
        ));
    }
  }
}

function doIndAbsurd(target: Value, mot: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof NEU) {
    if (targetNow.type === 'ABSURD') {
      return new NEU(
        mot,
        new N_IndAbsurd(targetNow.neutral, new Norm("UNIVERSE", mot)));
    }
  }
}

function doReplace(target: Value, mot: Value, b: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof SAME) {
    return b;
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof EQUAL) {
      const x = new MetaVar(null, targetNow.type.type, Symbol("x"));
      return new NEU(
        doAp(mot, target)!,
        new N_Replace(
          targetNow.neutral,
          new Norm(PIType([[x.name, x.varType]], "UNIVERSE"), mot),
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
  const k = new MetaVar(null, "NAT", Symbol("k"));
  const e = new MetaVar(null, Ev, Symbol("e"));
  const es = new MetaVar(null, new VEC(Ev, k), Symbol("es"));
  const ih = new MetaVar(null, doAp(doAp(mot, k)!, es)!, Symbol("ih"));
  return PIType(
    [[k.name, k.varType],
    [e.name, e.varType],
    [es.name, es.varType],
    [ih.name, ih.varType]
    ],
    doAp(doAp(mot, new ADD1(k))!, new VEC_CONS(Ev, es))!
  )
}

function doIndVec(len: Value, vec: Value, mot: Value, b: Value, s: Value): Value | undefined {
  const lenNow = now(len);
  const vecNow = now(vec);
  if (lenNow === 'ZERO' && vecNow === 'VECNIL') {
    return b;
  } else if (lenNow instanceof ADD1 && vecNow instanceof VEC_CONS) {
    return doAp(
      doAp(
        doAp(
          doAp(s, lenNow.smaller)!,
          vecNow.head
        )!,
        doTail(vec)!
      )!,
      doIndVec(lenNow.smaller, vecNow.tail, mot, b, s)!
    )!;
  } else if (lenNow instanceof NEU && vecNow instanceof NEU) {
    if (lenNow.type === 'NAT' && vecNow.type instanceof VEC) {
      const k = new MetaVar(null, "NAT", Symbol("k"));
      const es = new MetaVar(null, new VEC(vecNow.type.entryType, k), Symbol("es"));
      return new NEU(
        doAp(doAp(mot, len)!, vec)!,
        new N_IndVec12(
          lenNow.neutral,
          vecNow.neutral,
          new Norm(
            PIType(
              [[k.name, k.varType],
              [es.name, es.varType]],
              'UNIVERSE'),
            mot),
          new Norm(doAp(doAp(mot, 'ZERO')!, 'VECNIL')!, b),
          new Norm(indVecStepType(vecNow.type.entryType, mot), s)
        )
      );
    }
  } else if (lenNow === len && vecNow instanceof NEU) {
    if (vecNow.type instanceof VEC) {
      const k = new MetaVar(null, "NAT", Symbol("k"));
      const es = new MetaVar(null, new VEC(vecNow.type.entryType, k), Symbol("es"));
      return new NEU(
        doAp(doAp(mot, len)!, vec)!,
        new N_IndVec2(
          new Norm("NAT", len),
          vecNow.neutral,
          new Norm(
            PIType(
              [[k.name, k.varType],
              [es.name, es.varType]],
              'UNIVERSE'),
            mot),
          new Norm(doAp(doAp(mot, 'ZERO')!, 'VECNIL')!, b),
          new Norm(indVecStepType(vecNow.type.entryType, mot), s),
        )
      );
    }
  }
}

function doIndEither(target: Value, mot: Value, l: Value, r: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof LEFT) {
    return doAp(l, targetNow.value);
  } else if (targetNow instanceof RIGHT) {
    return doAp(r, targetNow.value);
  } else if (targetNow instanceof NEU) {
    if (targetNow.type instanceof EITHER) {
      const x = new MetaVar(
        null,
        new EITHER(targetNow.type.leftType, targetNow.type.rightType),
        Symbol("x")
      );
      const mot_tv = PIType([[x.name, x.varType]], 'UNIVERSE');
      const x1 = new MetaVar(null, targetNow.type.leftType, Symbol("x1"));
      const x2 = new MetaVar(null, targetNow.type.rightType, Symbol("x2"));
      return new NEU(
        doAp(mot, target)!,
        new N_IndEither(
          targetNow.neutral,
          new Norm(mot_tv, mot),
          new Norm(PIType([[x1.name, x1.varType]], doAp(mot, new LEFT(x1))!), l),
          new Norm(PIType([[x2.name, x2.varType]], doAp(mot, new RIGHT(x2))!), r)
        )
      );
    }
  }
}

function getCoreType(expr: Core): string {
  if (typeof expr === 'string') {
    return expr;
  } else if (typeof expr === 'symbol') {
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

function valOf(env: Env, expr: Core): Value | undefined {
  switch (getCoreType(expr)) {
    case 'the':
      return valOf(env, expr[2]);
    case 'U':
      return 'UNIVERSE';
    case 'Nat':
      return 'NAT';
    case 'zero':
      return 'ZERO';
    case 'add1':
      return new ADD1(later(env, expr[1]));
    case 'Π':
      const Pi_A_v = later(env, expr[1][0][1]);
      return new PI(expr[1][0][0], Pi_A_v, new FO_CLOS(env, expr[1][0], expr[2]))
    case 'λ':
      return new LAM(expr[1][0], new FO_CLOS(env, expr[1][0], expr[2]));
    case 'which-Nat':
      return doWhichNat(later(env, expr[1]), later(env, expr[2][1]), later(env, expr[2][2]), later(env, expr[3]));
    case 'iter-Nat':
      return doIterNat(later(env, expr[1]), later(env, expr[2][1]), later(env, expr[2][2]), later(env, expr[3]));
    case 'rec-Nat':
      return doRecNat(later(env, expr[1]), later(env, expr[2][1]), later(env, expr[2][2]), later(env, expr[3]));
    case 'ind-Nat':
      return doIndNat(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]), later(env, expr[4]));
    case "Atom":
      return "ATOM";
    case "Σ":
      const Sigma_A_v = later(env, expr[1][0][1]);
      return new SIGMA(expr[1][0][0], Sigma_A_v, new FO_CLOS(env, expr[1][0], expr[2]));
    case "cons":
      return new CONS(later(env, expr[1]), later(env, expr[2]));
    case "car":
      return doCar(later(env, expr[1]));
    case "cdr":
      return doCdr(later(env, expr[1]));
    case 'quote':
      if (typeof expr[1] === 'symbol') {
        return new QUOTE(expr[1]);
      }
    case 'Trivial':
      return 'TRIVIAL';
    case 'sole':
      return 'SOLE';
    case 'nil':
      return 'NIL';
    case '::':
      return new LIST_CONS(later(env, expr[1]), later(env, expr[2]));
    case 'List':
      return new LIST(later(env, expr[1]));
    case 'ind-List':
      return doIndList(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]), later(env, expr[4]));
    case 'rec-List':
      return doRecList(later(env, expr[1]), later(env, expr[2][1]), later(env, expr[2][2]), later(env, expr[3]));
    case 'Absurd':
      return 'ABSURD';
    case 'ind-Absurd':
      return doIndAbsurd(later(env, expr[1]), later(env, expr[2]));
    case '=':
      return new EQUAL(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'same':
      return new SAME(later(env, expr[1]));
    case 'replace':
      return doReplace(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'trans':
      return doTrans(later(env, expr[1]), later(env, expr[2]));
    case 'cong':
      return doCong(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'symm':
      return doSymm(later(env, expr[1]));
    case 'ind-Eq':
      return doIndEqual(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'Vec':
      return new VEC(later(env, expr[1]), later(env, expr[2]));
    case 'vecnil':
      return 'VECNIL';
    case 'vec::':
      return new VEC_CONS(later(env, expr[1]), later(env, expr[2]));
    case 'head':
      return doHead(later(env, expr[1]));
    case 'tail':
      return doTail(later(env, expr[1]));
    case 'ind-Vec':
      return doIndVec(later(env, expr[1]), later(env, expr[2]),
        later(env, expr[3]), later(env, expr[4]), later(env, expr[5]));
    case 'Either':
      return new EITHER(later(env, expr[1]), later(env, expr[2]));
    case 'left':
      return new LEFT(later(env, expr[1]));
    case 'right':
      return new RIGHT(later(env, expr[1]));
    case 'ind-Either':
      return doIndEither(later(env, expr[1]), later(env, expr[2]),
        later(env, expr[3]), later(env, expr[4]));
    case 'TODO':
      return new NEU(later(env, expr[2]), new N_TODO(expr[1], later(env, expr[2])));
    case 'operation':
      return doAp(later(env, expr[0] as Core), later(env, expr[1] as Core));
    default:
      if (typeof expr === 'symbol' && isVarName(expr)) {
        return varVal(env, expr);
      } else {
        console.error("No evaluator for: ", expr, "of type ", typeof expr);
      }

  }
}

/*
  ### Context serialization and deserialization ###

  In order to support both type checking and a REPL, Pie needs to be
  able to serialize contexts (which contain Pie values) into pure
  S-expressions (which are simple data that can be saved to disk or
  to a network).

  One disadvantage of the current approach is that laziness is
  lost. In other words, every value in the context is strictly
  evaluated as part of serializing it, which might make that process
  slow if there are values that take a long time to compute.
*/

function readBackContext(context: Ctx): SerializableCtx | undefined {

  if (context.length === 0) {
    return [];
  } else {
    const [[x, binding], ...rest] = context;
    if (binding instanceof Free) {
      return [[x, ['free', readBackType(rest, binding.type)!]], ...readBackContext(rest)!];
    } else if (binding instanceof Claim) {
      return [[x, ['claim', readBackType(rest, binding.type)!]], ...readBackContext(rest)!];
    } else if (binding instanceof Def) {
      return [[x, ['def', readBackType(rest, binding.type)!,
        readBack(rest, binding.type, binding.value)!]], ...readBackContext(rest)!];
    }
  }
}

function valOfCtx(serialCtx: SerializableCtx): Ctx {
  if (serialCtx.length === 0) {
    return [];
  } else {
    const [[x, b], ...rest] = serialCtx;
    const ctx = valOfCtx(rest);
    let binder
    switch (b[0]) {
      case 'free':
        binder = new Free(valInCtx(ctx, b[1])!);
        break;
      case 'claim':
        binder = new Claim(valInCtx(ctx, b[1])!);
        break;
      case 'def':
        binder = new Def(valInCtx(ctx, b[1])!, valInCtx(ctx, b[2])!);
        break;
    }
    return [[x, binder], ...ctx];
  }
}

/*
  ### Normalization ###

  Convert the value of a type back into the Core Pie syntax that
  represents it. These read-back types are checked for sameness using
  α-equiv?.
*/

function readBackType(context: Ctx, value: Value): Core | undefined {
  value = now(value);
  if (typeof (value) === 'string') {
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
    
    let A_e = readBackType(context, value.argType)!;
    let x_hat = fresh(context, value.argName);
    let ex_x_hat = bindFree(context, x_hat, value.argType);

    return ['Π', [[x_hat, A_e]], readBackType(ex_x_hat,
      valOfClosure(value.resultType, new NEU(value.argType, new N_Var(x_hat)))!)!];

  } else if (value instanceof SIGMA) {

    let A_e = readBackType(context, value.carType)!;
    let x_hat = fresh(context, value.carName);
    let ex_x_hat = bindFree(context, x_hat, value.carType);
    return ['Σ', [[x_hat, A_e]], readBackType(ex_x_hat,
      valOfClosure(value.cdrType, new NEU(value.carType, new N_Var(x_hat)))!)!];

  } else if (value instanceof LIST) {

    return ['List', readBackType(context, value.entryType)!];

  } else if (value instanceof EQUAL) {

    return ['=', readBackType(context, value.type)!,
      readBack(context, value.type, value.from)!, readBack(context, value.type, value.to)!];

  } else if (value instanceof VEC) {

    return ['Vec', readBackType(context, value.entryType)!,
      readBack(context, "NAT", value.length)!];

  } else if (value instanceof EITHER) {

    return ['Either', readBackType(context, value.leftType)!,
      readBackType(context, value.rightType)!];

  } else if (value instanceof NEU) {

    return readBackNeutral(context, value.neutral);

  }
}

function readBack(ctx: Ctx, type: Value, value: Value): Core | undefined {
  type = now(type);
  value = now(value);

  if (type === 'UNIVERSE') {

    return readBackType(ctx, value);

  } else if (type === 'NAT' && value === 'ZERO') {

    return 'zero';

  } else if (value instanceof ADD1) {

    return ['add1', readBack(ctx, 'NAT', value.smaller)!];

  } else if (type instanceof PI) {

    let y;
    if (value instanceof LAM) {
      y = value.argName;
    } else {
      y = type.argType;
    }
    const x_hat = fresh(ctx, y);

    return ['λ', [x_hat], readBack(bindFree(ctx, x_hat, y),
      valOfClosure(type.resultType, new NEU(type.argType, new N_Var(x_hat)))!,
      doAp(value, new NEU(type.argType, new N_Var(x_hat)))!)!];

  } else if (type instanceof SIGMA) {

    let the_car = doCar(value)!;
    return ['cons', readBack(ctx, type.carType, the_car)!,
      readBack(ctx, valOfClosure(type.cdrType, the_car)!, doCdr(value)!)!];

  } else if (type === "ATOM") {

    if (value instanceof QUOTE) {
      return ['quote', value.name];
    }

  } else if (type === "TRIVIAL") {
// TODO: why Symbol(sole)?
    return Symbol('sole');

  } else if (type instanceof LIST && value === 'NIL') {

    return 'nil';

  } else if (type instanceof LIST && value instanceof LIST_CONS) {

    return ['::', readBack(ctx, type.entryType, value.head)!,
      readBack(ctx, new LIST(type.entryType), value.tail)!];

  } else if (type === "ABSURD") {

    if (value instanceof NEU) {
      return ['the', 'Absurd', readBackNeutral(ctx, value.neutral)!];
    }

  } else if (type instanceof EQUAL) {

    if (value instanceof SAME) {
      return ['same', readBack(ctx, type.type, value.value)!];
    }

  } else if (type instanceof VEC && type.length == 'ZERO') {

    return 'vecnil';

  } else if (type instanceof VEC && type.length instanceof ADD1
    && value instanceof VEC_CONS) {

    return ['vec::', readBack(ctx, type.entryType, value.head)!,
      readBack(ctx, new VEC(type.entryType, type.length.smaller), value.tail)!];

  } else if (type instanceof EITHER && value instanceof LEFT) {

    return ['left', readBack(ctx, type.leftType, value.value)!];

  } else if (type instanceof EITHER && value instanceof RIGHT) {

    return ['right', readBack(ctx, type.rightType, value.value)!];

  } else if (value instanceof NEU) {
    return readBackNeutral(ctx, value.neutral)!;
  }
}

/*
  Read back a neutral expression. This process is not determined by
  the type, because type-driven reading back has already occurred by
  the time that read-back calls read-back-neutral.
*/
function readBackNeutral(context: Ctx, neutral: Neutral): Core | undefined {
  switch (neutral.whichKind) {
    case 'N_WhichNat': {
      const { target: tgt, base, step } = neutral as N_WhichNat;
      const { type: bTv, value: bV } = base as Norm;
      const { type: sTv, value: sV } = step as Norm;

      return [
        'which-Nat',
        readBackNeutral(context, tgt)!,
        ['the', readBackType(context, bTv)!, readBack(context, bTv, bV)!],
        readBack(context, sTv, sV)!,
      ];
    }

    case 'N_IterNat': {
      const { target: tgt, base: b, step: s } = neutral as N_IterNat;
      const { type: bTv, value: bV } = b;
      const { type: sTv, value: sV } = s;

      return [
        'iter-Nat',
        readBackNeutral(context, tgt)!,
        ['the', readBackType(context, bTv)!, readBack(context, bTv, bV)!],
        readBack(context, sTv, sV)!,
      ];
    }

    case 'N_RecNat': {
      const { target: tgt, base: b, step: s } = neutral as N_RecNat;
      const { type: bTv, value: bV } = b;
      const { type: sTv, type: sV } = s;

      return [
        'rec-Nat',
        readBackNeutral(context, tgt)!,
        ['the', readBackType(context, bTv)!, readBack(context, bTv, bV)!],
        readBack(context, sTv, sV)!,
      ];
    }

    case 'N_IndNat': {
      const { target: tgt, motive: mot, base: b, step: s } = neutral as N_IndNat;
      const { type: motTv, value: motV } = mot;
      const { type: bTv, value: bV } = b;
      const { type: sTv, value: sV } = s;

      return [
        'ind-Nat',
        readBackNeutral(context, tgt)!,
        readBack(context, motTv, motV)!,
        readBack(context, bTv, bV)!,
        readBack(context, sTv, sV)!,
      ];
    }

    case 'N_Car': {
      const { target: tgt } = neutral as N_Car;
      return ['car', readBackNeutral(context, tgt)!];
    }

    case 'N_Cdr': {
      const { target: tgt } = neutral as N_Cdr;
      return ['cdr', readBackNeutral(context, tgt)!];
    }

    case 'N_IndList': {
      const { target: tgt, motive: mot, base: b, step: s } = neutral as N_IndList;
      const { type: motT, value: motV } = mot;
      const { type: bT, value: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-List',
        readBackNeutral(context, tgt)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_RecList': {
      const { target: tgt, base: b, step: s } = neutral as N_RecList;
      const { type: bT, value: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'rec-List',
        readBackNeutral(context, tgt)!,
        ['the', readBackType(context, bT)!, readBack(context, bT, bV)!],
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_IndAbsurd': {
      const { target: tgt, motive: mot } = neutral as N_IndAbsurd;
      const { type: ttv, value: tv } = mot;

      return [
        'ind-Absurd',
        ['the', 'Absurd', readBackNeutral(context, tgt)!],
        readBack(context, tv, ttv)!,
      ];
    }

    case 'N_Replace': {
      const { target: tgt, motive: mot, base: b } = neutral as N_Replace;
      const { type: motTv, value: motV } = mot;
      const { type: bTv, value: bV } = b;

      return [
        'replace',
        readBackNeutral(context, tgt)!,
        readBack(context, motTv, motV)!,
        readBack(context, bTv, bV)!,
      ];
    }

    case 'N_Trans12': {
      const { target1: p1, target2: p2 } = neutral as N_Trans12;
      return ['trans', readBackNeutral(context, p1)!, readBackNeutral(context, p2)!];
    }

    case 'N_Trans1': {
      const { target1: ne, target2: t2 } = neutral as N_Trans1;
      const { type: t, value: v } = t2;
      return ['trans', readBackNeutral(context, ne)!, readBack(context, t, v)!];
    }

    case 'N_Trans2': {
      const { target1: n, target2: ne } = neutral as N_Trans2;
      const { type: t, value: v } = n;
      return ['trans', readBack(context, t, v)!, readBackNeutral(context, ne)!];
    }

    case 'N_Cong': {
      const { target: ne, func: f } = neutral as N_Cong;
      const { type: type, value: v } = f;
      const { argName: n, argType: av, resultType: c } = type as PI;
      return [
        'cong',
        readBackNeutral(context, ne)!,
        readBackType(context, valOfClosure(c, 'ABSURD')!)!,
        readBack(context, new PI(n, av, c), v)!,
      ];
    }

    case 'N_Symm': {
      const { target } = neutral as N_Symm;
      return ['symm', readBackNeutral(context, target)!];
    }

    case 'N_Ind-=': {
      const { target: ne, motive: mot, base: b } = neutral as N_IndEq;
      const { type: motT, value: motV } = mot;
      const { type: bT, value: bV } = b;

      return [
        'ind-=',
        readBackNeutral(context, ne)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
      ];
    }

    case 'N_Head': {
      const { target: ne } = neutral as N_Head;
      return ['head', readBackNeutral(context, ne)!];
    }

    case 'N_Tail': {
      const { target: ne } = neutral as N_Tail;
      return ['tail', readBackNeutral(context, ne)!];
    }

    case 'N_IndVec1': {
      const { target1: len, target2: es, motive: mot, base: b, step: s } = neutral as N_IndVec1;
      const { type: esT, value: esV } = es;
      const { type: motT, value: motV } = mot;
      const { type: bT, type: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-Vec',
        readBackNeutral(context, len)!,
        readBack(context, esT, esV)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_IndVec2': {
      const { target1: len, target2: es, motive: mot, base: b, step: s } = neutral as N_IndVec2;
      const { type: lenT, value: lenV } = len;
      const { type: motT, value: motV } = mot;
      const { type: bT, type: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-Vec',
        readBack(context, lenT, lenV)!,
        readBackNeutral(context, es)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_IndVec12': {
      const { target1: len, target2: es, motive: mot, base: b, step: s } = neutral as N_IndVec12;
      const { type: motT, value: motV } = mot as Norm;
      const { type: bT, value: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-Vec',
        readBackNeutral(context, len)!,
        readBackNeutral(context, es)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_IndEither': {
      const { target: tgt, motive: mot, baseLeft: l, baseRight: r } = neutral as N_IndEither;
      const { type: mot_t, value: mot_v } = mot;
      const { type: lTv, value: lV } = l;
      const { type: rTv, value: rV } = r;

      return [
        'ind-Either',
        readBackNeutral(context, tgt)!,
        readBack(context, mot_t, mot_v)!,
        readBack(context, lTv, lV)!,
        readBack(context, rTv, rV)!,
      ];
    }

    case 'N_Ap': {
      const { rator: target, rand } = neutral as N_Ap;
      const { type, value } = rand as Norm;
      return [
        readBackNeutral(context, target)!,
        readBack(context, type, value)!
      ];
    }

    case 'N_Var': {
      const { name } = neutral as N_Var;
      return name;
    }

    case 'N_TODO': {
      const { where: where, type: type } = neutral as N_TODO;
      return ['TODO', where, readBackType(context, type)!];
    }
    default:
      return undefined;
  }
}

/*
  General-purpose helpers

  Given a value for a closure's free variable, find the value. This
  cannot be used for DELAY-CLOS, because DELAY-CLOS's laziness
  closures do not have free variables, but are instead just delayed
  computations.
*/
function valOfClosure(c: Closure, v: Value): Value | undefined {
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
function valInCtx(context: Ctx, core: Core): Value | undefined {
  return valOf(ctxToEnv(context), core);
}

export {
  valInCtx,
  now,
  readBack,
  readBackType,
  readBackNeutral,
  valOfClosure,
  valOf,
  valOfCtx,
  readBackContext,
  doAp,
  PIType,
  indVecStepType
};