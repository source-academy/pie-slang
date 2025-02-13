/*
  ## Normalize.rkt ##
  This file implements normalization by evaluation.
*/

import util from 'util';
import { P } from 'ts-pattern';
import * as C from './types/core'
import * as S from "./types/source"

import * as V from "./types/value"
import { locationToSrcLoc } from './locations';
import { Environment } from './types/environment';

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

function later(env: Environment, expr: C.Core): V.Value {
  return new V.V_Delay(new Box(new DelayClosure(env, expr)));
}

// undelay is used to find the value that is contained in a
// DELAY-CLOS closure by invoking the evaluator.
function undelay(c: V.DelayClosure): V.Value {
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
function now(v: V.Value): Value {
  if (v instanceof V_Delay && v.val instanceof Box) {
    const content = v.val.contents;
    if (content instanceof DelayClosure) {
      let theValue = undelay(content);
      v.val.contents = theValue;
      return theValue;
    }
    return content;
  }
  return v;
}

function PIType(arglist: [Symbol, Value.Value][], ret: Value.Value): Value.V_Pi | Value.Value {
  if (arglist.length === 0) {
    return ret;
  } else {
    const [argName, argType] = arglist[0];
    return new V_Pi(argName, argType, new HO_CLOS((x) => PIType(arglist.slice(1), ret)));
  }
}


function doAp(rator: Value.Value, rand: Value.Value): Value.Value | undefined {
  const rtFin = now(rator);

  if (rtFin instanceof Value.V_Lambda) {
    return valOfClosure(rtFin.body, rand);
  }
  else if (rtFin instanceof Value.V_Neutral) {
    if (rtFin.type instanceof V_Pi) {
      return new V_Neutral(
        valOfClosure(rtFin.type.resultType, rand)!,
        new N_Ap(rtFin.neutral, new Norm(rtFin.type.argType, rand)));
    }
  }
}

function doWhichNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetFin = now(target);
  if (targetFin === 'ZERO') {
    return b;
  } else if (targetFin instanceof V_Add1) {
    return doAp(s, targetFin.smaller);
  } else if (targetFin instanceof V_Neutral) {
    if (targetFin.type === 'NAT') {
      const n = new N_MetaVar(null, "NAT", Symbol("n"));
      return new V_Neutral(
        b_t,
        new C_WhichNat(
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
  } else if (targetNow instanceof V_Add1) {
    const nMinusOne = targetNow.smaller;
    return doAp(s, doIterNat(nMinusOne, bVType, bV, s)!);
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type !== 'NAT') {
      return undefined;
    }
    const n = new MetaVar(null, "NAT", Symbol("n"));
    const neutral = targetNow.neutral;
    return new V_Neutral(bVType, new C_IterNat(
      neutral,
      new Norm(bVType, bV),
      new Norm(PIType([[n.name, n.varType]], bVType), s))
    );
  }
}

function doRecNat(target: Value, b_t: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'ZERO') {
    return b;
  } else if (targetNow instanceof V_Add1) {
    const nMinusOne = targetNow.smaller;
    return doAp(s, new V_Add1(nMinusOne));
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type !== 'NAT') {
      return undefined;
    }
    const n_smaller = new MetaVar(null, "NAT", Symbol("n-1"));
    const ih = new MetaVar(null, b_t, Symbol("ih"));
    const neutral = targetNow.neutral;
    return new V_Neutral(b_t, new C_RecNat(neutral,
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
  } else if (targetNow instanceof V_Add1) {
    const nMinusOne = targetNow.smaller;
    return doAp(s, new V_Add1(nMinusOne));
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type === 'NAT') {
      const n_smaller = new MetaVar(null, "NAT", Symbol("n-1"));
      const x = new MetaVar(null, "NAT", Symbol("x"));
      const ih = new MetaVar(null, doAp(mot, n_smaller)!, Symbol("ih"));
      return new V_Neutral(
        doAp(mot, target)!,
        new C_IndNat(
          targetNow.neutral,
          new Norm(PIType([[x.name, x.varType]], 'UNIVERSE'), mot),
          new Norm(doAp(mot, 'ZERO')!, b),
          new Norm(
            PIType([
              [x.name, x.varType],
              [ih.name, ih.varType],
            ], doAp(mot, new V_Add1(n_smaller))!),
            s
          )
        )
      );
    }
  }
}

function doCar(p: Value): Value | undefined {
  const nowP: Value = now(p);
  if (nowP instanceof V_Cons) {
    return nowP.car;
  } else if (nowP instanceof V_Neutral) {
    const type = nowP.type;
    const neutral = nowP.neutral;
    if (!(neutral instanceof V_Sigma)) {
      return undefined;
    }
    const A = neutral.carType;
    return new V_Neutral(A, new C_Car(neutral));
  }
}


function doCdr(p: Value): Value | undefined {
  const nowP: Value = now(p);
  if (nowP instanceof V_Cons) {
    return nowP.cdr;
  } else if (nowP instanceof V_Neutral) {
    const type = nowP.type;
    const neutral = nowP.neutral;
    if (!(neutral instanceof V_Sigma)) {
      return undefined;
    }
    return new V_Neutral(valOfClosure(neutral.cdrType, doCar(nowP)!)!, new N_Cdr(neutral));
  }
}

function doIndList(target: Value, mot: Value, b: Value, s: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow === 'NIL') {
    return b;
  } else if (targetNow instanceof V_ListCons) {
    const h = targetNow.head;
    const t = targetNow.tail;
    return doAp(
      doAp(doAp(s, h)!, t)!,
      doIndList(t, mot, b, s)!
    )!;
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_List) {
      const E = targetNow.type.entryType;
      const ne = targetNow.neutral;

      const xs = new MetaVar(null, new V_List(E), Symbol("xs"));
      const h = new MetaVar(null, E, Symbol("h"));
      const t = new MetaVar(null, new V_List(E), Symbol("t"));
      const ih = new MetaVar(null, doAp(mot, t)!, Symbol("ih"));

      const motTv = PIType([[xs.name, xs.varType]], 'UNIVERSE');
      return new V_Neutral(
        doAp(mot, target)!,
        new C_IndList(
          ne,
          new Norm(motTv, mot),
          new Norm(doAp(mot, 'NIL')!, b),
          new Norm(
            PIType([
              [h.name, h.varType],
              [t.name, t.varType],
              [t.name, t.varType]
            ], doAp(mot, new V_ListCons(h, t)!)!),
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
  } else if (targetNow instanceof V_ListCons) {
    const h = targetNow.head;
    const t = targetNow.tail;
    return doAp(
      doAp(doAp(s, h)!, t)!,
      doRecList(t, bt, b, s)!
    )!;
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_List) {
      const E = targetNow.type.entryType;
      const ne = targetNow.neutral;

      const h = new MetaVar(null, E, Symbol("h"));
      const t = new MetaVar(null, new V_List(E), Symbol("t"));
      const ih = new MetaVar(null, doAp(bt, t)!, Symbol("ih"));

      return new V_Neutral(
        bt,
        new C_RecList(
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
  if (targetNow instanceof V_Neutral) {
    if (targetNow.type === 'ABSURD') {
      return new V_Neutral(
        mot,
        new C_IndAbsurd(targetNow.neutral, new Norm("UNIVERSE", mot)));
    }
  }
}

function doReplace(target: Value, mot: Value, b: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V_Same) {
    return b;
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Equal) {
      const x = new MetaVar(null, targetNow.type.type, Symbol("x"));
      return new V_Neutral(
        doAp(mot, target)!,
        new C_Replace(
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
  if (target1Now instanceof V_Same && target2Now instanceof V_Same) {
    return new V_Same(target1Now.value);
  } else if (target1Now instanceof V_Same && target2Now instanceof V_Neutral) {
    if (target2Now.type instanceof V_Equal) {
      return new V_Neutral(
        new V_Equal(target2Now.type.type, target1Now.value, target2Now.type.to),
        new N_Trans2(
          new Norm(
            new V_Equal(target2Now.type.type, target1Now.value, target1Now.value),
            new V_Same(target1Now.value)
          ),
          target2Now.neutral
        )
      );
    }
  } else if (target1Now instanceof V_Neutral && target2Now instanceof V_Same) {
    if (target1Now.type instanceof V_Equal) {
      return new V_Neutral(
        new V_Equal(target1Now.type.type, target1Now.type.from, target2Now.value),
        new N_Trans1(
          target1Now.neutral,
          new Norm(
            new V_Equal(target1Now.type.type, target2Now.value, target2Now.value),
            new V_Same(target2Now.value)
          )
        )
      );
    }
  } else if (target1Now instanceof V_Neutral && target2Now instanceof NEU) {
    if (target1Now.type instanceof V_Equal && target2Now.type instanceof V_Equal) {
      return new V_Neutral(
        new V_Equal(target1Now.type.type, target1Now.type.from, target2Now.type.to),
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
  if (targetNow instanceof V_Same) {
    return new V_Same(doAp(fun, targetNow.value)!);
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Equal) {
      return new V_Neutral(
        new V_Equal(B, doAp(fun, targetNow.type.from)!, doAp(fun, targetNow.type.to)!),
        new C_Cong(
          targetNow.neutral,
          new Norm(PIType([[Symbol("x"), targetNow.type.type]], B), fun)
        )
      );
    }
  }
}

function doSymm(target: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V_Same) {
    return new V_Same(targetNow.value);
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Equal) {
      return new V_Neutral(
        new V_Equal(targetNow.type.type, targetNow.type.to, targetNow.type.from),
        new C_Symm(targetNow.neutral)
      );
    }
  }
}

function doIndV_Equal(target: Value, mot: Value, base: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V_Same) {
    return base;
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Equal) {
      return new V_Neutral(
        mot,
        new C_Replace(
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
  if (targetNow instanceof V_VecCons) {
    return targetNow.head;
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Vec) {
      if (targetNow.type.length instanceof V_Add1) {
        return new V_Neutral(
          targetNow.type.entryType,
          new C_Head(targetNow.neutral)
        );
      }
    }
  }
}

function doTail(target: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V_VecCons) {
    return targetNow.tail;
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Vec) {
      if (targetNow.type.length instanceof V_Add1) {
        return new V_Neutral(
          new V_Vec(targetNow.type.entryType, targetNow.type.length.smaller),
          new C_Tail(targetNow.neutral)
        );
      }
    }
  }
}

function indV_VecStepType(Ev: Value, mot: Value): Value {
  const k = new MetaVar(null, "NAT", Symbol("k"));
  const e = new MetaVar(null, Ev, Symbol("e"));
  const es = new MetaVar(null, new V_Vec(Ev, k), Symbol("es"));
  const ih = new MetaVar(null, doAp(doAp(mot, k)!, es)!, Symbol("ih"));
  return PIType(
    [[k.name, k.varType],
    [e.name, e.varType],
    [es.name, es.varType],
    [ih.name, ih.varType]
    ],
    doAp(doAp(mot, new V_Add1(k))!, new V_V_VecCons(Ev, es))!
  )
}

function doIndV_Vec(len: Value, V_Vec: Value, mot: Value, b: Value, s: Value): Value | undefined {
  const lenNow = now(len);
  const V_VecNow = now(V_Vec);
  if (lenNow === 'ZERO' && V_VecNow === 'V_VecNIL') {
    return b;
  } else if (lenNow instanceof V_Add1 && V_VecNow instanceof V_V_VecCons) {
    return doAp(
      doAp(
        doAp(
          doAp(s, lenNow.smaller)!,
          V_VecNow.head
        )!,
        doTail(V_Vec)!
      )!,
      doIndV_Vec(lenNow.smaller, V_VecNow.tail, mot, b, s)!
    )!;
  } else if (lenNow instanceof V_Neutral && V_VecNow instanceof V_Neutral) {
    if (lenNow.type === 'NAT' && V_VecNow.type instanceof V_Vec) {
      const k = new MetaVar(null, "NAT", Symbol("k"));
      const es = new MetaVar(null, new V_Vec(V_VecNow.type.entryType, k), Symbol("es"));
      return new V_Neutral(
        doAp(doAp(mot, len)!, V_Vec)!,
        new N_IndV_Vec12(
          lenNow.neutral,
          V_VecNow.neutral,
          new Norm(
            PIType(
              [[k.name, k.varType],
              [es.name, es.varType]],
              'UNIVERSE'),
            mot),
          new Norm(doAp(doAp(mot, 'ZERO')!, 'V_VecNIL')!, b),
          new Norm(indV_VecStepType(V_VecNow.type.entryType, mot), s)
        )
      );
    }
  } else if (lenNow === len && V_VecNow instanceof V_Neutral) {
    if (V_VecNow.type instanceof V_Vec) {
      const k = new MetaVar(null, "NAT", Symbol("k"));
      const es = new MetaVar(null, new V_Vec(V_VecNow.type.entryType, k), Symbol("es"));
      return new NEU(
        doAp(doAp(mot, len)!, V_Vec)!,
        new N_IndV_Vec2(
          new Norm("NAT", len),
          V_VecNow.neutral,
          new Norm(
            PIType(
              [[k.name, k.varType],
              [es.name, es.varType]],
              'UNIVERSE'),
            mot),
          new Norm(doAp(doAp(mot, 'ZERO')!, 'V_VecNIL')!, b),
          new Norm(indV_VecStepType(V_VecNow.type.entryType, mot), s),
        )
      );
    }
  }
}

function doIndEither(target: Value, mot: Value, l: Value, r: Value): Value | undefined {
  const targetNow = now(target);
  if (targetNow instanceof V_Left) {
    return doAp(l, targetNow.value);
  } else if (targetNow instanceof V_Right) {
    return doAp(r, targetNow.value);
  } else if (targetNow instanceof V_Neutral) {
    if (targetNow.type instanceof V_Either) {
      const x = new MetaVar(
        null,
        new V_Either(targetNow.type.leftType, targetNow.type.rightType),
        Symbol("x")
      );
      const mot_tv = PIType([[x.name, x.varType]], 'UNIVERSE');
      const x1 = new MetaVar(null, targetNow.type.leftType, Symbol("x1"));
      const x2 = new MetaVar(null, targetNow.type.rightType, Symbol("x2"));
      return new NEU(
        doAp(mot, target)!,
        new C_IndEither(
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
    case 'V_Add1':
      return new V_Add1(later(env, expr[1]));
    case 'Π':
      const Pi_A_v = later(env, expr[1][0][1]);
      return new V_Pi(expr[1][0][0], Pi_A_v, new FO_CLOS(env, expr[1][0], expr[2]))
    case 'λ':
      return new V_Lambda(expr[1][0], new FO_CLOS(env, expr[1][0], expr[2]));
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
      return new V_Sigma(expr[1][0][0], Sigma_A_v, new FO_CLOS(env, expr[1][0], expr[2]));
    case "cons":
      return new V_Cons(later(env, expr[1]), later(env, expr[2]));
    case "car":
      return doCar(later(env, expr[1]));
    case "cdr":
      return doCdr(later(env, expr[1]));
    case 'quote':
      if (typeof expr[1] === 'symbol') {
        return new V_Quote(expr[1]);
      }
    case 'Trivial':
      return 'TRIVIAL';
    case 'sole':
      return 'SOLE';
    case 'nil':
      return 'NIL';
    case '::':
      return new V_ListCons(later(env, expr[1]), later(env, expr[2]));
    case 'List':
      return new V_List(later(env, expr[1]));
    case 'ind-List':
      return doIndList(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]), later(env, expr[4]));
    case 'rec-List':
      return doRecList(later(env, expr[1]), later(env, expr[2][1]), later(env, expr[2][2]), later(env, expr[3]));
    case 'Absurd':
      return 'ABSURD';
    case 'ind-Absurd':
      return doIndAbsurd(later(env, expr[1]), later(env, expr[2]));
    case '=':
      return new V_Equal(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'same':
      return new V_Same(later(env, expr[1]));
    case 'replace':
      return doReplace(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'trans':
      return doTrans(later(env, expr[1]), later(env, expr[2]));
    case 'cong':
      return doCong(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'symm':
      return doSymm(later(env, expr[1]));
    case 'ind-Eq':
      return doIndV_Equal(later(env, expr[1]), later(env, expr[2]), later(env, expr[3]));
    case 'V_Vec':
      return new V_Vec(later(env, expr[1]), later(env, expr[2]));
    case 'V_Vecnil':
      return 'V_VecNIL';
    case 'V_Vec::':
      return new V_V_VecCons(later(env, expr[1]), later(env, expr[2]));
    case 'head':
      return doHead(later(env, expr[1]));
    case 'tail':
      return doTail(later(env, expr[1]));
    case 'ind-V_Vec':
      return doIndV_Vec(later(env, expr[1]), later(env, expr[2]),
        later(env, expr[3]), later(env, expr[4]), later(env, expr[5]));
    case 'Either':
      return new V_Either(later(env, expr[1]), later(env, expr[2]));
    case 'left':
      return new V_Left(later(env, expr[1]));
    case 'right':
      return new V_Right(later(env, expr[1]));
    case 'ind-Either':
      return doIndEither(later(env, expr[1]), later(env, expr[2]),
        later(env, expr[3]), later(env, expr[4]));
    case 'TODO':
      return new V_Neutral(later(env, expr[2]), new C_TODO(expr[1], later(env, expr[2])));
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
  } else if (value instanceof V_Pi) {
    
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

  } else if (value instanceof V_Equal) {

    return ['=', readBackType(context, value.type)!,
      readBack(context, value.type, value.from)!, readBack(context, value.type, value.to)!];

  } else if (value instanceof V_Vec) {

    return ['V_Vec', readBackType(context, value.entryType)!,
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

  } else if (value instanceof V_Add1) {

    return ['V_Add1', readBack(ctx, 'NAT', value.smaller)!];

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

  } else if (type instanceof V_Equal) {

    if (value instanceof V_Same) {
      return ['same', readBack(ctx, type.type, value.value)!];
    }

  } else if (type instanceof V_Vec && type.length == 'ZERO') {

    return 'V_Vecnil';

  } else if (type instanceof V_Vec && type.length instanceof V_Add1
    && value instanceof V_V_VecCons) {

    return ['V_Vec::', readBack(ctx, type.entryType, value.head)!,
      readBack(ctx, new V_Vec(type.entryType, type.length.smaller), value.tail)!];

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

    case 'N_IndV_Vec1': {
      const { target1: len, target2: es, motive: mot, base: b, step: s } = neutral as N_IndV_Vec1;
      const { type: esT, value: esV } = es;
      const { type: motT, value: motV } = mot;
      const { type: bT, type: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-V_Vec',
        readBackNeutral(context, len)!,
        readBack(context, esT, esV)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_IndV_Vec2': {
      const { target1: len, target2: es, motive: mot, base: b, step: s } = neutral as N_IndV_Vec2;
      const { type: lenT, value: lenV } = len;
      const { type: motT, value: motV } = mot;
      const { type: bT, type: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-V_Vec',
        readBack(context, lenT, lenV)!,
        readBackNeutral(context, es)!,
        readBack(context, motT, motV)!,
        readBack(context, bT, bV)!,
        readBack(context, sT, sV)!,
      ];
    }

    case 'N_IndV_Vec12': {
      const { target1: len, target2: es, motive: mot, base: b, step: s } = neutral as N_IndV_Vec12;
      const { type: motT, value: motV } = mot as Norm;
      const { type: bT, value: bV } = b;
      const { type: sT, value: sV } = s;

      return [
        'ind-V_Vec',
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
  indV_VecStepType
};