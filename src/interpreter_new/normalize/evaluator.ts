import * as util from "util";
import * as V from "../types/value";
import * as N from "../types/neutral";
import { HigherOrderClosure } from '../types/utils';
import { now, natEqual} from './utils';

/*
  ### The Evaluators ###

  Functions whose names begin with "do-" are helpers that implement
  the corresponding eliminator.
*/

export function doApp(operator: V.Value, operand: V.Value): V.Value {
  const operatorNow = now(operator);
  if (operatorNow instanceof V.Lambda) {
    return operatorNow.body.valOfClosure(operand);
  } else if (operatorNow instanceof V.Neutral &&
    operatorNow.type instanceof V.Pi) {
    return new V.Neutral(
      operatorNow.type.resultType.valOfClosure(operand),
      new N.Application(
        operatorNow.neutral,
        new N.Norm(operatorNow.type.argType, operand)
      )
    );
  } else {
    throw new Error(`doApp: invalid input ${util.inspect([operator, operand])}`);
  }
}

export function doWhichNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for whichNat ${util.inspect([target, baseType, base, step])}`);
  }
}

export function doIterNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      step,
      doIterNat(targetNow.smaller, baseType, base, step)
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
  } else {
    throw new Error(`invalid input for iterNat ${util.inspect([target, baseType, base, step])}`);
  }
}

export function doRecNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      step,
      doRecNat(targetNow.smaller, baseType, base, step)
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
  } else {
    throw new Error(`invalid input for recNat ${util.inspect([target, baseType, base, step])}`);
  }
}

export function doIndNat(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = now(target);
  if (targetNow instanceof V.Zero) {
    return base;
  } else if (targetNow instanceof V.Add1) {
    return doApp(
      doApp(step, targetNow.smaller),
      doIndNat(targetNow.smaller, motive, base, step)
    );
  } else if (targetNow instanceof V.Neutral
    && targetNow.type instanceof V.Nat) {
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
  } else {
    throw new Error(`invalid input for indNat ${util.inspect([target, motive, base, step])}`);
  }
}


export function doCar(p: V.Value): V.Value {
  const pairNow: V.Value = now(p);
  if (pairNow instanceof V.Cons) {
    return pairNow.car;
  } else if (pairNow instanceof V.Neutral &&
    pairNow.type instanceof V.Sigma) {
    const sigma = pairNow.type;
    const neutral = pairNow.neutral;
    return new V.Neutral(sigma.carType, new N.Car(neutral));
  } else {
    throw new Error(`invalid input for car ${util.inspect(p)}`);
  }
}


export function doCdr(pair: V.Value): V.Value {
  const pairNow: V.Value = now(pair);
  if (pairNow instanceof V.Cons) {
    return pairNow.cdr;
  } else if (pairNow instanceof V.Neutral &&
    pairNow.type instanceof V.Sigma) {
    const sigma = pairNow.type;
    const neutral = pairNow.neutral;
    return new V.Neutral(
      sigma.cdrType.valOfClosure(doCar(pair)),
      new N.Cdr(neutral)
    )
  } else {
    throw new Error(`invalid input for cdr ${util.inspect(pair)}`);
  }
}


export function doIndList(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = now(target);
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
  } else if (targetNow instanceof V.Neutral && targetNow.type instanceof V.List) {
    const entryType = targetNow.type.entryType;
    const neutral = targetNow.neutral;
    const motiveType = new V.Pi(
      "xs",
      new V.List(entryType),
      new HigherOrderClosure((xs) => new V.Universe())
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
  } else {
    throw new Error(`invalid input for indList ${util.inspect([targetNow, motive, base, step])}`);
  }
}

export function doRecList(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value {
  const targetNow = now(target);
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
  } else {
    throw new Error(`invalid input for recList ${util.inspect([targetNow, baseType, base, step])}`);
  }
}


export function doIndAbsurd(target: V.Value, motive: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for indAbsurd ${util.inspect([target, motive])}`);
  }
}


export function doReplace(target: V.Value, motive: V.Value, base: V.Value): V.Value {
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
      doApp(motive, to),
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
        new N.Norm(doApp(motive, from), base)
      )
    );
  } else {
    throw new Error(`invalid input for replace ${util.inspect([target, motive, base])}`);
  }
}


export function doTrans(target1: V.Value, target2: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for ${util.inspect([target1, target2])}`);
  }
}


export function doCong(target: V.Value, base: V.Value, func: V.Value): V.Value {
  const targetNow = now(target);
  if (targetNow instanceof V.Same) {
    return new V.Same(doApp(func, targetNow.value));
  } else if (targetNow instanceof V.Neutral &&
    targetNow.type instanceof V.Equal) {
    const eqType = targetNow.type.type;
    const from = targetNow.type.from;
    const to = targetNow.type.to;
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
  } else {
    throw new Error(`invalid input for cong ${util.inspect([target, base, func])}`);
  }
}

export function doSymm(target: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for symm ${util.inspect(target)}`);
  }
}


export function doIndEqual(target: V.Value, motive: V.Value, base: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for indEqual ${util.inspect([target, motive, base])}`);
  }
}


export function doHead(target: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for head ${util.inspect(target)}`);
  }
}


export function doTail(target: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for tail ${util.inspect(target)}`);
  }
}

export function indVecStepType(Ev: V.Value, mot: V.Value): V.Value {
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
  const lenNow = now(len);
  const vecNow = now(vec);
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
    && lenNow.type instanceof V.Nat && vecNow.type instanceof V.Vec) {
    const entryType = vecNow.type.entryType;
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
            vecNow.type.entryType, motive), step)
      )
    );

  } else if (natEqual(lenNow, len) && vecNow instanceof V.Neutral && vecNow.type instanceof V.Vec) {
    const entryType = vecNow.type.entryType;
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
    throw new Error(`invalid input for indVec ${util.inspect([len, vec, motive, base, step])}`);
  }
}

export function doIndEither(target: V.Value, motive: V.Value, left: V.Value, right: V.Value): V.Value {
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
  } else {
    throw new Error(`invalid input for indEither
      ${util.inspect([target, motive, left, right])}`);
  }
}

