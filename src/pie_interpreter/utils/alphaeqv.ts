import * as C from '../types/core';
import { isVarName } from '../types/utils';
import { SourceLocation } from './locations';
import { inspect } from 'util'

export function alphaEquiv(e1: C.Core, e2: C.Core): boolean {
  return alphaEquivAux(0, new Map(), new Map(), e1, e2);
}


type Bindings = Map<string, number>;

const FV = -1;

function bind(b: Bindings, x: string, lvl: number): Bindings {
  return b.set(x, lvl) as Bindings;
}

function findBinding(x: string, b: Bindings): number {
  if (b.has(x)) {
    return b.get(x)!;
  }
  // x is not bound, return -1.
  return FV;
}

function alphaEquivAux(lvl: number, b1: Bindings, b2: Bindings, e1: C.Core, e2: C.Core): boolean {
  if (e1 instanceof C.VarName && e2 instanceof C.VarName) {
    const n1 = e1.name;
    const n2 = e2.name;
    if (isVarName(n1) && isVarName(n2)) {
      const xBinding = findBinding(n1, b1);
      const yBinding = findBinding(n2, b2);
      // both bound
      if (xBinding !== FV && yBinding !== FV) {
        return xBinding === yBinding;
      } else if (xBinding === FV && yBinding === FV) {
        // both free
        return n1 === n2;
      } else {
        // one bound, one free
        return false;
      }
      // Compare to the original version,
      // the contructor equality is not considered here as our
      // implementations of constructors are different.
      // Orginally using strings, we use classes.
      // they will be dealt with in the following cases.
    } else {
      return false;
    }
  } else if (e1 instanceof C.Quote && e2 instanceof C.Quote) {
    // Atoms must be the same atom
    return e1.sym === e2.sym;

  } else if (e1 instanceof C.Pi && e2 instanceof C.Pi) {
    return alphaEquivAux(lvl, b1, b2, e1.type, e2.type)
      &&
      alphaEquivAux(lvl + 1, bind(b1, e1.name, lvl), bind(b2, e2.name, lvl), e1.body, e2.body);

  } else if (e1 instanceof C.Sigma && e2 instanceof C.Sigma) {
    return alphaEquivAux(lvl, b1, b2, e1.type, e2.type)
      &&
      alphaEquivAux(lvl + 1, bind(b1, e1.name, lvl), bind(b2, e2.name, lvl), e1.body, e2.body);

  } else if (e1 instanceof C.Lambda && e2 instanceof C.Lambda) {
    return alphaEquivAux(
      lvl + 1,
      bind(b1, e1.param, lvl),
      bind(b2, e2.param, lvl),
      e1.body,
      e2.body
    );

  } else if (e1 instanceof C.The
    && e2 instanceof C.The
    && e1.type instanceof C.Absurd
    && e2.type instanceof C.Absurd) {
    return true;

  } else if (e1 instanceof C.Application && e2 instanceof C.Application) {
    return alphaEquivAux(lvl, b1, b2, e1.fun, e2.fun)
      &&
      alphaEquivAux(lvl, b1, b2, e1.arg, e2.arg);

  }
  // following cases are one word constructors 
  else if (
    (e1 instanceof C.Universe && e2 instanceof C.Universe) ||
    (e1 instanceof C.Nat && e2 instanceof C.Nat) ||
    (e1 instanceof C.Zero && e2 instanceof C.Zero) ||
    (e1 instanceof C.Atom && e2 instanceof C.Atom) ||
    (e1 instanceof C.Absurd && e2 instanceof C.Absurd) ||
    (e1 instanceof C.Sole && e2 instanceof C.Sole) ||
    (e1 instanceof C.Nil && e2 instanceof C.Nil) ||
    (e1 instanceof C.VecNil && e2 instanceof C.VecNil) ||
    (e1 instanceof C.Trivial && e2 instanceof C.Trivial)
  ) {
    return true;
  }
  // following cases are for multiple word constructors, and eliminators.
  else if (e1 instanceof C.The && e2 instanceof C.The) {
    return alphaEquivAux(lvl, b1, b2, e1.type, e2.type)
      &&
      alphaEquivAux(lvl, b1, b2, e1.expr, e2.expr);
  } else if (e1 instanceof C.List && e2 instanceof C.List) {
    return alphaEquivAux(lvl, b1, b2, e1.elemType, e2.elemType);
  } else if (e1 instanceof C.Add1 && e2 instanceof C.Add1) {
    return alphaEquivAux(lvl, b1, b2, e1.n, e2.n);

  } else if (e1 instanceof C.WhichNat && e2 instanceof C.WhichNat) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);

  } else if (e1 instanceof C.IterNat && e2 instanceof C.IterNat) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);
  } else if (e1 instanceof C.RecNat && e2 instanceof C.RecNat) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);
  } else if (e1 instanceof C.IndNat && e2 instanceof C.IndNat) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);
  } else if (e1 instanceof C.Cons && e2 instanceof C.Cons) {
    return alphaEquivAux(lvl, b1, b2, e1.first, e2.first)
      &&
      alphaEquivAux(lvl, b1, b2, e1.second, e2.second);
  } else if (e1 instanceof C.Car && e2 instanceof C.Car) {
    return alphaEquivAux(lvl, b1, b2, e1.pair, e2.pair);
  } else if (e1 instanceof C.Cdr && e2 instanceof C.Cdr) {
    return alphaEquivAux(lvl, b1, b2, e1.pair, e2.pair);
  } else if (e1 instanceof C.ListCons && e2 instanceof C.ListCons) {
    return alphaEquivAux(lvl, b1, b2, e1.head, e2.head)
      &&
      alphaEquivAux(lvl, b1, b2, e1.tail, e2.tail);
  } else if (e1 instanceof C.RecList && e2 instanceof C.RecList) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);
  } else if (e1 instanceof C.IndList && e2 instanceof C.IndList) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);
  } else if (e1 instanceof C.IndAbsurd && e2 instanceof C.IndAbsurd) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive);
  } else if (e1 instanceof C.Equal && e2 instanceof C.Equal) {
    return alphaEquivAux(lvl, b1, b2, e1.type, e2.type)
      &&
      alphaEquivAux(lvl, b1, b2, e1.left, e2.left)
      &&
      alphaEquivAux(lvl, b1, b2, e1.right, e2.right);

  } else if (e1 instanceof C.Same && e2 instanceof C.Same) {
    return alphaEquivAux(lvl, b1, b2, e1.type, e2.type);

  } else if (e1 instanceof C.Replace && e2 instanceof C.Replace) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base);

  } else if (e1 instanceof C.Trans && e2 instanceof C.Trans) {
    return alphaEquivAux(lvl, b1, b2, e1.left, e2.left)
      &&
      alphaEquivAux(lvl, b1, b2, e1.right, e2.right);

  } else if (e1 instanceof C.Cong && e2 instanceof C.Cong) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.fun, e2.fun);
  } else if (e1 instanceof C.Symm && e2 instanceof C.Symm) {
    return alphaEquivAux(lvl, b1, b2, e1.equality, e2.equality);

  } else if (e1 instanceof C.IndEqual && e2 instanceof C.IndEqual) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base);
  } else if (e1 instanceof C.Vec && e2 instanceof C.Vec) {
    return alphaEquivAux(lvl, b1, b2, e1.type, e2.type)
      &&
      alphaEquivAux(lvl, b1, b2, e1.length, e2.length)
  } else if (e1 instanceof C.VecCons && e2 instanceof C.VecCons) {
    return alphaEquivAux(lvl, b1, b2, e1.head, e2.head)
      &&
      alphaEquivAux(lvl, b1, b2, e1.tail, e2.tail);
  } else if (e1 instanceof C.Head && e2 instanceof C.Head) {
    return alphaEquivAux(lvl, b1, b2, e1.vec, e2.vec);
  } else if (e1 instanceof C.Tail && e2 instanceof C.Tail) {
    return alphaEquivAux(lvl, b1, b2, e1.vec, e2.vec);
  } else if (e1 instanceof C.IndVec && e2 instanceof C.IndVec) {
    return alphaEquivAux(lvl, b1, b2, e1.length, e2.length)
      &&
      alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive)
      &&
      alphaEquivAux(lvl, b1, b2, e1.base, e2.base)
      &&
      alphaEquivAux(lvl, b1, b2, e1.step, e2.step);
  } else if (e1 instanceof C.Either && e2 instanceof C.Either) {
    return alphaEquivAux(lvl, b1, b2, e1.left, e2.left)
      &&
      alphaEquivAux(lvl, b1, b2, e1.right, e2.right);
  } else if (e1 instanceof C.Left && e2 instanceof C.Left) {
    return alphaEquivAux(lvl, b1, b2, e1.value, e2.value);
  } else if (e1 instanceof C.Right && e2 instanceof C.Right) {
    return alphaEquivAux(lvl, b1, b2, e1.value, e2.value);
  } else if (e1 instanceof C.IndEither && e2 instanceof C.IndEither) {
    return alphaEquivAux(lvl, b1, b2, e1.target, e2.target)
      &&
      alphaEquivAux(lvl, b1, b2, e1.motive, e2.motive)
      &&
      alphaEquivAux(lvl, b1, b2, e1.baseLeft, e2.baseLeft)
      &&
      alphaEquivAux(lvl, b1, b2, e1.baseRight, e2.baseRight);
  } else if (e1 instanceof C.TODO && e2 instanceof C.TODO) {
    return sameLocation(e1.loc, e2.loc) && alphaEquivAux(lvl, b1, b2, e1.type, e2.type);
  }
  // if none of the above cases are met, return false.
  else {
    return false;
  }
}

function sameLocation(e1: SourceLocation, e2: SourceLocation): boolean {
  return e1.startLine === e2.startLine &&
    e1.startColumn === e2.startColumn &&
    e1.endLine === e2.endLine &&
    e1.endColumn === e2.endColumn;
}

/* function alphaEquivAuxSeq(lvl: number, b1: Bindings, b2: Bindings, es1: C.Core[], es2: C.Core[]): boolean {
  if (es1.length !== es2.length) {
    return false;
  }
  for (let i = 0; i < es1.length; i++) {
    if (!alphaEquivAux(lvl, b1, b2, es1[i], es2[i])) {
      return false;
    }
  }
  return true;
} */