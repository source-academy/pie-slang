import * as V from "../types/value";
import * as N from "../types/neutral";
import { HigherOrderClosure } from '../types/utils';
import { natEqual } from './utils';
import { inspect } from "util";

//TODO: add else cases and throw errors

/*
  ### The Evaluators ###

  Functions whose names begin with "do-" are helpers that implement
  the corresponding eliminator.
*/

/**
 * 
 * @param operator 
 * @param operand 
 * @returns result of applying operator to operand
 */
export function doApp(operator: V.Value, operand: V.Value): V.Value {
  const operatorNow = operator.now();
  if (operatorNow instanceof V.Lambda) {
    return operatorNow.body.valOfClosure(operand);
  } else if (operatorNow instanceof V.Neutral) {
    const typeNow = operatorNow.type.now();
    if (typeNow instanceof V.Pi) {
      return new V.Neutral(
        typeNow.resultType.valOfClosure(operand),
        new N.Application(
          operatorNow.neutral,
          new N.Norm(typeNow.argType, operand)
        )
      );
    }
  }
  throw new Error(`doApp: invalid input ${[operatorNow, operand]}`);
}

/**
 * 
 * @param target 
 * @param baseType 
 * @param base 
 * @param step 
 * @returns result of applying whichNat eliminator
 */
export function doWhichNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(step, targetNow.smaller);
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Nat) {
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
  throw new Error(`invalid input for whichNat ${[target, baseType, base, step]}`);
}

export function doIterNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      step,
      doIterNat(targetNow.smaller, baseType, base, step)
    );
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Nat) {
      return new V.Neutral(baseType, new N.IterNat(
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
  throw new Error(`invalid input for iterNat ${[target, baseType, base, step]}`);
}

export function doRecNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      doApp(step, targetNow.smaller),
      doRecNat(targetNow.smaller, baseType, base, step),
    );
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Nat) {
      return new V.Neutral(
        baseType, 
        new N.RecNat(
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
        )
      );
    }
  }
  throw new Error(`invalid input for recNat ${[target, baseType, base, step]}`);

}

export function doIndNat(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      doApp(step, targetNow.smaller),
      doIndNat(targetNow.smaller, motive, base, step)
    );
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Nat) {
      return new V.Neutral(
        doApp(motive, target),
        new N.IndNat(
          targetNow.neutral,
          new N.Norm(new V.Pi(
            "x",
            new V.Nat(),
            new HigherOrderClosure((_) => new V.Universe())
          ), motive),
          new N.Norm(doApp(motive, new V.Zero()), base),
          new N.Norm(
            new V.Pi(
              "n-1",
              new V.Nat(),
              new HigherOrderClosure(
                (n_minus_1) =>
                  new V.Pi(
                    "ih",
                    doApp(motive, n_minus_1),
                    new HigherOrderClosure(
                      (_) => doApp(motive, new V.Add1(n_minus_1))
                    )
                  )
              )
            ), step
          )
        )
      );
    }
  }
  throw new Error(`invalid input for indNat ${[target, motive, base, step]}`);

}


export function doCar(pair: V.Value): V.Value {
  const pairNow: V.Value = pair.now();
  if (pairNow instanceof V.Cons) {
    return pairNow.car;
  } else if (pairNow instanceof V.Neutral) {
    const pairType = pairNow.type.now();
    if (pairType instanceof V.Sigma) {
      const sigma = pairType;
      const neutral = pairNow.neutral;
      return new V.Neutral(sigma.carType, new N.Car(neutral));
    }
  }
  throw new Error(`invalid input for car ${pair}`);

}


export function doCdr(pair: V.Value): V.Value {
  const pairNow: V.Value = pair.now();
  if (pairNow instanceof V.Cons) {
    return pairNow.cdr;
  } else if (pairNow instanceof V.Neutral) {
    const pairType = pairNow.type.now();
    if (pairType instanceof V.Sigma) {
      const sigma = pairType;
      const neutral = pairNow.neutral;
      return new V.Neutral(
        sigma.cdrType.valOfClosure(doCar(pair)),
        new N.Cdr(neutral)
      );
    }

  }
  throw new Error(`invalid input for cdr ${pair}`);

}


export function doIndList(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Nil) {
    return base;
  } else if (targetNow instanceof V.ListCons) {
    return doApp(
      doApp(
        doApp(
          step,
          targetNow.head
        ),
        targetNow.tail
      ),
      doIndList(targetNow.tail, motive, base, step)
    );
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.List) {
      const entryType = typeNow.entryType;
      const neutral = targetNow.neutral;
      const motiveType = new V.Pi(
        "xs",
        new V.List(entryType),
        new HigherOrderClosure((_) => new V.Universe())
      );
      return new V.Neutral(
        doApp(motive, target),
        new N.IndList(
          neutral,
          new N.Norm(motiveType, motive),
          new N.Norm(doApp(motive, new V.Nil()), base),
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
                      doApp(motive, t),
                      new HigherOrderClosure((_) =>
                        doApp(motive, new V.ListCons(h, t))
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
  throw new Error(`invalid input for indList ${[targetNow, motive, base, step]}`);

}

export function doRecList(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Nil) {
    return base;
  } else if (targetNow instanceof V.ListCons) {
    const head = targetNow.head;
    const tail = targetNow.tail;
    return doApp(
      doApp(
        doApp(step, head),
        tail),
      doRecList(tail, baseType, base, step)
    );
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.List) {
      const entryType = typeNow.entryType;
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
              new HigherOrderClosure((_) =>
                new V.Pi(
                  "t",
                  new V.List(entryType),
                  new HigherOrderClosure((_) =>
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
  throw new Error(`invalid input for recList ${[targetNow, baseType, base, step]}`);

}


export function doIndAbsurd(target: V.Value, motive: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Absurd) {
      return new V.Neutral(
        motive,
        new N.IndAbsurd(
          targetNow.neutral,
          new N.Norm(new V.Universe(), motive)
        )
      );
    }
  }
  throw new Error(`invalid input for indAbsurd ${[target, motive]}`);
}


export function doReplace(target: V.Value, motive: V.Value, base: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Same) {
    return base;
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Equal) {
      const neutral = targetNow.neutral;
      const eqType = typeNow.type;
      const from = typeNow.from;
      const to = typeNow.to;
      return new V.Neutral(
        doApp(motive, to),
        new N.Replace(
          neutral,
          new N.Norm(
            new V.Pi(
              "x",
              eqType,
              new HigherOrderClosure(
                (_) => new V.Universe()
              )
            ),
            motive
          ),
          new N.Norm(doApp(motive, from), base)
        )
      );
    }
  }
  throw new Error(`invalid input for replace ${[target, motive, base]}`);

}


export function doTrans(target1: V.Value, target2: V.Value): V.Value {
  const target1Now = target1.now();
  const target2Now = target2.now();
  if (target1Now instanceof V.Same && target2Now instanceof V.Same) {
    return new V.Same(target1Now.value);
  } else if (target1Now instanceof V.Same && target2Now instanceof V.Neutral) {
    const type2Now = target2Now.type.now();
    if (type2Now instanceof V.Equal) {
      const from = target1Now.value;
      const to = type2Now.to;
      const eqType = type2Now.type;
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
    }
  } else if (target1Now instanceof V.Neutral && target2Now instanceof V.Same) {
    const type1Now = target1Now.type.now();
    if (type1Now instanceof V.Equal) {
      const from = type1Now.from;
      const to = target2Now.value;
      const eqType = type1Now.type;
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
    }
  } else if (
    target1Now instanceof V.Neutral && target2Now instanceof V.Neutral) {
    const type1Now = target1Now.type.now();
    const type2Now = target2Now.type.now();
    if (type1Now instanceof V.Equal && type2Now instanceof V.Equal) {
      const from = type1Now.from;
      const to = type2Now.to;
      const eqType = type1Now.type;
      const neutral1 = target1Now.neutral;
      const neutral2 = target2Now.neutral;
      return new V.Neutral(
        new V.Equal(eqType, from, to),
        new N.Trans12(neutral1, neutral2)
      );
    }
  }
  throw new Error(`invalid input for do-trans: ${[target1, target2]}`);
}


export function doCong(target: V.Value, base: V.Value, func: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Same) {
    return new V.Same(doApp(func, targetNow.value));
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Equal) {
      const eqType = typeNow.type;
      const from = typeNow.from;
      const to = typeNow.to;
      const neutral = targetNow.neutral;
      return new V.Neutral(
        new V.Equal(
          base,
          doApp(func, from),
          doApp(func, to)
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
  throw new Error(`invalid input for cong ${[target, base, func]}`);
}

export function doSymm(target: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Same) {
    return new V.Same(targetNow.value);
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Equal) {
      return new V.Neutral(
        new V.Equal(
          typeNow.type,
          typeNow.to,
          typeNow.from
        ),
        new N.Symm(targetNow.neutral)
      );
    }
  }
  throw new Error(`invalid input for symm ${target}`);
}


export function doIndEqual(target: V.Value, motive: V.Value, base: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Same) {
    return base;
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Equal) {
      const eqType = typeNow.type;
      const from = typeNow.from;
      const to = typeNow.to;
      const neutral = targetNow.neutral;
      return new V.Neutral(
        doApp(doApp(motive, to), target),
        new N.IndEqual(
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
            doApp(doApp(motive, from), new V.Same(from)),
            base
          )
        )
      );
    }
  }
  throw new Error(`invalid input for indEqual ${[target, motive, base]}`);
}

export function doHead(target: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.VecCons) {
    return targetNow.head;
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Vec) {
      const lengthNow = typeNow.length.now();
      if (lengthNow instanceof V.Add1) {
        return new V.Neutral(
          typeNow.entryType,
          new N.Head(targetNow.neutral)
        );
      }
    }
  }
  throw new Error(`invalid input for head ${target}`);
}


export function doTail(target: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.VecCons) {
    return targetNow.tail;
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type.now() instanceof V.Vec &&
    ((targetNow.type.now() as V.Vec).length).now() instanceof V.Add1) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Vec) {
      const lengthNow = typeNow.length.now();
      if (lengthNow instanceof V.Add1) {
        return new V.Neutral(
          new V.Vec(
            (targetNow.type.now() as V.Vec).entryType,
            ((targetNow.type.now() as V.Vec).length.now() as V.Add1).smaller
          ),
          new N.Tail(targetNow.neutral)
        );
      }
    }
  }
  throw new Error(`invalid input for tail ${target.prettyPrint()}`);
}

export function indVecStepType(Ev: V.Value, mot: V.Value): V.Value {
  return new V.Pi(
    "k",
    new V.Nat(),
    new HigherOrderClosure(
      (k) => new V.Pi(
        "e",
        Ev,
        new HigherOrderClosure(
          (e) => new V.Pi(
            "es",
            new V.Vec(Ev, k),
            new HigherOrderClosure(
              (es) => new V.Pi(
                "ih",
                doApp(doApp(mot, k), es),
                new HigherOrderClosure(
                  (_) =>
                    doApp(
                      doApp(mot, new V.Add1(k)),
                      new V.VecCons(e, es)
                    )
                )
              )
            )
          )
        )
      )
    )
  );
}


export function doIndVec(len: V.Value, vec: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value {
  const lenNow = len.now();
  const vecNow = vec.now();
  if (lenNow instanceof V.Zero && vecNow instanceof V.VecNil) {
    return base;
  } else if (lenNow instanceof V.Add1 && vecNow instanceof V.VecCons) {
    return doApp(
      doApp(
        doApp(
          doApp(step, lenNow.smaller),
          vecNow.head
        ),
        doTail(vec)
      ),
      doIndVec(
        lenNow.smaller,
        vecNow.tail,
        motive,
        base,
        step
      )
    );
  } else if (lenNow instanceof V.Neutral && vecNow instanceof V.Neutral
    && lenNow.type.now() instanceof V.Nat && vecNow.type.now() instanceof V.Vec) {
    const entryType = (vecNow.type.now() as V.Vec).entryType;
    return new V.Neutral(
      doApp(doApp(motive, len), vec),
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
            doApp(motive, new V.Zero), new V.VecNil()
          ),
          base
        ),
        new N.Norm(
          indVecStepType(
            (vecNow.type.now() as V.Vec).entryType, motive), step)
      )
    );
  } else if (natEqual(lenNow, len) && vecNow instanceof V.Neutral && (vecNow.type.now()) instanceof V.Vec) {
    const entryType = (vecNow.type.now() as V.Vec).entryType;
    return new V.Neutral(
      doApp(doApp(motive, len), vec),
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
            doApp(motive, new V.Nat()),
            new V.VecNil
          ),
          base),
        new N.Norm(
          indVecStepType(
            entryType, motive
          ),
          step
        ),
      )
    );
  } else {
    throw new Error(`invalid input for indVec ${[len, vec, motive, base, step]}`);
  }
}

export function doIndEither(target: V.Value, motive: V.Value, left: V.Value, right: V.Value): V.Value {
  const targetNow = target.now();
  if (targetNow instanceof V.Left) {
    return doApp(left, targetNow.value);
  } else if (targetNow instanceof V.Right) {
    return doApp(right, targetNow.value);
  } else if (targetNow instanceof V.Neutral) {
    const typeNow = targetNow.type.now();
    if (typeNow instanceof V.Either) {
      const leftType = typeNow.leftType;
      const rightType = typeNow.rightType;
      const motiveType = new V.Pi(
        "x",
        new V.Either(leftType, rightType),
        new HigherOrderClosure((x) => new V.Universe())
      )
      return new V.Neutral(
        doApp(motive, target),
        new N.IndEither(
          targetNow.neutral,
          new N.Norm(motiveType, motive),
          new N.Norm(
            new V.Pi(
              "x",
              leftType,
              new HigherOrderClosure(
                (x) => doApp(motive, new V.Left(x))
              )
            ),
            left
          ),
          new N.Norm(
            new V.Pi(
              "x",
              rightType,
              new HigherOrderClosure(
                (x) => doApp(motive, new V.Right(x))
              )
            ),
            right
          )
        )
      )
    }
  }
  throw new Error(`invalid input for indEither: ${[target, motive, left, right]}`);
}