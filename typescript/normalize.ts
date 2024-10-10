/*
  ## Normalize.rkt ##
  This file implements normalization by evaluation.
*/

import {Env, Core, Value, DELAY, DELAY_CLOS, Box, varVal, LAM, NEU, Closure, FO_CLOS, HO_CLOS, extendEnv} from './basics'
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
  return now(valOf(c.env, c.expr));
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

function getCoreType(expr: Core) : String {
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

function doAp (rator: Value, rand: Value): Value {
  const rator_finished = now(rator);

  if (rator instanceof LAM) {
    return rator.f(rand);
  }
  throw new Error(`do-ap: ${rator} is not a function`);
}

/*
function valOf(env: Env, expr: Core): Value {
  if (Array.isArray(expr)) {
    if (expr instanceof Symbol) {
      
    }
  }

  switch (getCoreType(expr)) {
    case 'The':
      return valOf(env, expr.expr);
    case 'U':
      return 'UNIVERSE';
    case 'Nat':
      return 'NAT';
    case 'Zero':
      return 'ZERO';
    case 'Add1':
      return ADD1(later(env, expr.n));
    case 'Pi':
      const A_v = later(env, expr.A);
      return PI(expr.x, A_v, FO_CLOS(env, expr.x, expr.B));
    case 'Lambda':
      return LAM(expr.x, FO_CLOS(env, expr.x, expr.body));
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
      const A_v_Sigma = later(env, expr.A);
      return SIGMA(expr.x, A_v_Sigma, FO_CLOS(env, expr.x, expr.D));
    case 'Cons':
      return CONS(later(env, expr.a), later(env, expr.d));
    case 'Car':
      return doCar(later(env, expr.p));
    case 'Cdr':
      return doCdr(later(env, expr.p));
    case 'Quote':
      if (typeof expr.a === 'symbol') {
        return QUOTE(expr.a);
      }
      break;
    case 'Trivial':
      return 'TRIVIAL';
    case 'Sole':
      return 'SOLE';
    case 'Nil':
      return 'NIL';
    case 'ListCons':
      return LIST_CONS(later(env, expr.h), later(env, expr.t));
    case 'List':
      return LIST(later(env, expr.E));
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
      return EQUAL(
        later(env, expr.A),
        later(env, expr.from),
        later(env, expr.to)
      );
    case 'Same':
      return SAME(later(env, expr.e));
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
      return VEC(later(env, expr.E), later(env, expr.len));
    case 'VecNil':
      return 'VECNIL';
    case 'VecCons':
      return VEC_CONS(later(env, expr.h), later(env, expr.t));
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
      return EITHER(later(env, expr.L), later(env, expr.R));
    case 'Left':
      return LEFT(later(env, expr.l));
    case 'Right':
      return RIGHT(later(env, expr.r));
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
    default:
      if (typeof expr === 'string' && isVarName(expr)) {
        return varVal(env, expr);
      }
      throw new Error(`No evaluator for ${expr}`);
  }
}
*/
/*
  General-purpose helpers

  Given a value for a closure's free variable, find the value. This
  cannot be used for DELAY-CLOS, because DELAY-CLOS's laziness
  closures do not have free variables, but are instead just delayed
  computations.
*/
function ValOfClosure(c: Closure, v: Value): Value {
  if (c instanceof FO_CLOS) {
    return extendEnv(c.env, c.x, v);
  }
}
/*
  Find the value of an expression in the environment that
  corresponds to a context.
*/
(: val-in-ctx (-> Ctx Core Value))
(define (val-in-ctx Γ e)
  (val-of (ctx->env Γ) e))
