"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doApp = doApp;
exports.doWhichNat = doWhichNat;
exports.doIterNat = doIterNat;
exports.doRecNat = doRecNat;
exports.doIndNat = doIndNat;
exports.doCar = doCar;
exports.doCdr = doCdr;
exports.doIndList = doIndList;
exports.doRecList = doRecList;
exports.doIndAbsurd = doIndAbsurd;
exports.doReplace = doReplace;
exports.doTrans = doTrans;
exports.doCong = doCong;
exports.doSymm = doSymm;
exports.doIndEqual = doIndEqual;
exports.doHead = doHead;
exports.doTail = doTail;
exports.indVecStepType = indVecStepType;
exports.doIndVec = doIndVec;
exports.doIndEither = doIndEither;
var V = require("../types/value");
var N = require("../types/neutral");
var utils_1 = require("../types/utils");
var utils_2 = require("./utils");
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
function doApp(operator, operand) {
    var operatorNow = operator.now();
    if (operatorNow instanceof V.Lambda) {
        return operatorNow.body.valOfClosure(operand);
    }
    else if (operatorNow instanceof V.Neutral) {
        var typeNow = operatorNow.type.now();
        if (typeNow instanceof V.Pi) {
            return new V.Neutral(typeNow.resultType.valOfClosure(operand), new N.Application(operatorNow.neutral, new N.Norm(typeNow.argType, operand)));
        }
    }
    throw new Error("doApp: invalid input ".concat([operatorNow, operand]));
}
/**
 *
 * @param target
 * @param baseType
 * @param base
 * @param step
 * @returns result of applying whichNat eliminator
 */
function doWhichNat(target, baseType, base, step) {
    var targetNow = target.now();
    if (targetNow instanceof V.Zero) {
        return base;
    }
    else if (targetNow instanceof V.Add1) {
        return doApp(step, targetNow.smaller);
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Nat) {
            return new V.Neutral(baseType, new N.WhichNat(targetNow.neutral, new N.Norm(baseType, base), new N.Norm(new V.Pi("n", new V.Nat(), new utils_1.HigherOrderClosure(function (_) { return baseType; })), step)));
        }
    }
    throw new Error("invalid input for whichNat ".concat([target, baseType, base, step]));
}
function doIterNat(target, baseType, base, step) {
    var targetNow = target.now();
    if (targetNow instanceof V.Zero) {
        return base;
    }
    else if (targetNow instanceof V.Add1) {
        return doApp(step, doIterNat(targetNow.smaller, baseType, base, step));
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Nat) {
            return new V.Neutral(baseType, new N.IterNat(targetNow.neutral, new N.Norm(baseType, base), new N.Norm(new V.Pi("n", new V.Nat(), new utils_1.HigherOrderClosure(function (_) { return baseType; })), step)));
        }
    }
    throw new Error("invalid input for iterNat ".concat([target, baseType, base, step]));
}
function doRecNat(target, baseType, base, step) {
    var targetNow = target.now();
    if (targetNow instanceof V.Zero) {
        return base;
    }
    else if (targetNow instanceof V.Add1) {
        return doApp(doApp(step, targetNow.smaller), doRecNat(targetNow.smaller, baseType, base, step));
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Nat) {
            return new V.Neutral(baseType, new N.RecNat(targetNow.neutral, new N.Norm(baseType, base), new N.Norm(new V.Pi("n-1", new V.Nat(), new utils_1.HigherOrderClosure(function (_) { return new V.Pi("ih", baseType, new utils_1.HigherOrderClosure(function (_) { return baseType; })); })), step)));
        }
    }
    throw new Error("invalid input for recNat ".concat([target, baseType, base, step]));
}
function doIndNat(target, motive, base, step) {
    var targetNow = target.now();
    if (targetNow instanceof V.Zero) {
        return base;
    }
    else if (targetNow instanceof V.Add1) {
        return doApp(doApp(step, targetNow.smaller), doIndNat(targetNow.smaller, motive, base, step));
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Nat) {
            return new V.Neutral(doApp(motive, target), new N.IndNat(targetNow.neutral, new N.Norm(new V.Pi("x", new V.Nat(), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })), motive), new N.Norm(doApp(motive, new V.Zero()), base), new N.Norm(new V.Pi("n-1", new V.Nat(), new utils_1.HigherOrderClosure(function (n_minus_1) {
                return new V.Pi("ih", doApp(motive, n_minus_1), new utils_1.HigherOrderClosure(function (_) { return doApp(motive, new V.Add1(n_minus_1)); }));
            })), step)));
        }
    }
    throw new Error("invalid input for indNat ".concat([target, motive, base, step]));
}
function doCar(pair) {
    var pairNow = pair.now();
    if (pairNow instanceof V.Cons) {
        return pairNow.car;
    }
    else if (pairNow instanceof V.Neutral) {
        var pairType = pairNow.type.now();
        if (pairType instanceof V.Sigma) {
            var sigma = pairType;
            var neutral = pairNow.neutral;
            return new V.Neutral(sigma.carType, new N.Car(neutral));
        }
    }
    throw new Error("invalid input for car ".concat(pair));
}
function doCdr(pair) {
    var pairNow = pair.now();
    if (pairNow instanceof V.Cons) {
        return pairNow.cdr;
    }
    else if (pairNow instanceof V.Neutral) {
        var pairType = pairNow.type.now();
        if (pairType instanceof V.Sigma) {
            var sigma = pairType;
            var neutral = pairNow.neutral;
            return new V.Neutral(sigma.cdrType.valOfClosure(doCar(pair)), new N.Cdr(neutral));
        }
    }
    throw new Error("invalid input for cdr ".concat(pair));
}
function doIndList(target, motive, base, step) {
    var targetNow = target.now();
    if (targetNow instanceof V.Nil) {
        return base;
    }
    else if (targetNow instanceof V.ListCons) {
        return doApp(doApp(doApp(step, targetNow.head), targetNow.tail), doIndList(targetNow.tail, motive, base, step));
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.List) {
            var entryType_1 = typeNow.entryType;
            var neutral = targetNow.neutral;
            var motiveType = new V.Pi("xs", new V.List(entryType_1), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); }));
            return new V.Neutral(doApp(motive, target), new N.IndList(neutral, new N.Norm(motiveType, motive), new N.Norm(doApp(motive, new V.Nil()), base), new N.Norm(new V.Pi("h", entryType_1, new utils_1.HigherOrderClosure(function (h) {
                return new V.Pi("t", new V.List(entryType_1), new utils_1.HigherOrderClosure(function (t) {
                    return new V.Pi("ih", doApp(motive, t), new utils_1.HigherOrderClosure(function (_) {
                        return doApp(motive, new V.ListCons(h, t));
                    }));
                }));
            })), step)));
        }
    }
    throw new Error("invalid input for indList ".concat([targetNow, motive, base, step]));
}
function doRecList(target, baseType, base, step) {
    var targetNow = target.now();
    if (targetNow instanceof V.Nil) {
        return base;
    }
    else if (targetNow instanceof V.ListCons) {
        var head = targetNow.head;
        var tail = targetNow.tail;
        return doApp(doApp(doApp(step, head), tail), doRecList(tail, baseType, base, step));
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.List) {
            var entryType_2 = typeNow.entryType;
            var neutral = targetNow.neutral;
            return new V.Neutral(baseType, new N.RecList(neutral, new N.Norm(baseType, base), new N.Norm(new V.Pi("h", entryType_2, new utils_1.HigherOrderClosure(function (_) {
                return new V.Pi("t", new V.List(entryType_2), new utils_1.HigherOrderClosure(function (_) {
                    return new V.Pi("ih", baseType, new utils_1.HigherOrderClosure(function (_) {
                        return baseType;
                    }));
                }));
            })), step)));
        }
    }
    throw new Error("invalid input for recList ".concat([targetNow, baseType, base, step]));
}
function doIndAbsurd(target, motive) {
    var targetNow = target.now();
    if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Absurd) {
            return new V.Neutral(motive, new N.IndAbsurd(targetNow.neutral, new N.Norm(new V.Universe(), motive)));
        }
    }
    throw new Error("invalid input for indAbsurd ".concat([target, motive]));
}
function doReplace(target, motive, base) {
    var targetNow = target.now();
    if (targetNow instanceof V.Same) {
        return base;
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Equal) {
            var neutral = targetNow.neutral;
            var eqType = typeNow.type;
            var from = typeNow.from;
            var to = typeNow.to;
            return new V.Neutral(doApp(motive, to), new N.Replace(neutral, new N.Norm(new V.Pi("x", eqType, new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })), motive), new N.Norm(doApp(motive, from), base)));
        }
    }
    throw new Error("invalid input for replace ".concat([target, motive, base]));
}
function doTrans(target1, target2) {
    var target1Now = target1.now();
    var target2Now = target2.now();
    if (target1Now instanceof V.Same && target2Now instanceof V.Same) {
        return new V.Same(target1Now.value);
    }
    else if (target1Now instanceof V.Same && target2Now instanceof V.Neutral) {
        var type2Now = target2Now.type.now();
        if (type2Now instanceof V.Equal) {
            var from = target1Now.value;
            var to = type2Now.to;
            var eqType = type2Now.type;
            var neutral2 = target2Now.neutral;
            return new V.Neutral(new V.Equal(eqType, from, to), new N.Trans2(new N.Norm(new V.Equal(eqType, from, from), new V.Same(from)), neutral2));
        }
    }
    else if (target1Now instanceof V.Neutral && target2Now instanceof V.Same) {
        var type1Now = target1Now.type.now();
        if (type1Now instanceof V.Equal) {
            var from = type1Now.from;
            var to = target2Now.value;
            var eqType = type1Now.type;
            var neutral1 = target1Now.neutral;
            return new V.Neutral(new V.Equal(eqType, from, to), new N.Trans1(neutral1, new N.Norm(new V.Equal(eqType, to, to), new V.Same(to))));
        }
    }
    else if (target1Now instanceof V.Neutral && target2Now instanceof V.Neutral) {
        var type1Now = target1Now.type.now();
        var type2Now = target2Now.type.now();
        if (type1Now instanceof V.Equal && type2Now instanceof V.Equal) {
            var from = type1Now.from;
            var to = type2Now.to;
            var eqType = type1Now.type;
            var neutral1 = target1Now.neutral;
            var neutral2 = target2Now.neutral;
            return new V.Neutral(new V.Equal(eqType, from, to), new N.Trans12(neutral1, neutral2));
        }
    }
    throw new Error("invalid input for do-trans: ".concat([target1, target2]));
}
function doCong(target, base, func) {
    var targetNow = target.now();
    if (targetNow instanceof V.Same) {
        return new V.Same(doApp(func, targetNow.value));
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Equal) {
            var eqType = typeNow.type;
            var from = typeNow.from;
            var to = typeNow.to;
            var neutral = targetNow.neutral;
            return new V.Neutral(new V.Equal(base, doApp(func, from), doApp(func, to)), new N.Cong(neutral, new N.Norm(new V.Pi("x", eqType, new utils_1.HigherOrderClosure(function (x) { return base; })), func)));
        }
    }
    throw new Error("invalid input for cong ".concat([target, base, func]));
}
function doSymm(target) {
    var targetNow = target.now();
    if (targetNow instanceof V.Same) {
        return new V.Same(targetNow.value);
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Equal) {
            return new V.Neutral(new V.Equal(typeNow.type, typeNow.to, typeNow.from), new N.Symm(targetNow.neutral));
        }
    }
    throw new Error("invalid input for symm ".concat(target));
}
function doIndEqual(target, motive, base) {
    var targetNow = target.now();
    if (targetNow instanceof V.Same) {
        return base;
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Equal) {
            var eqType_1 = typeNow.type;
            var from_1 = typeNow.from;
            var to = typeNow.to;
            var neutral = targetNow.neutral;
            return new V.Neutral(doApp(doApp(motive, to), target), new N.IndEqual(neutral, new N.Norm(new V.Pi("to", eqType_1, new utils_1.HigherOrderClosure(function (to) { return new V.Pi("p", new V.Equal(eqType_1, from_1, to), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); })), motive), new N.Norm(doApp(doApp(motive, from_1), new V.Same(from_1)), base)));
        }
    }
    throw new Error("invalid input for indEqual ".concat([target, motive, base]));
}
function doHead(target) {
    var targetNow = target.now();
    if (targetNow instanceof V.VecCons) {
        return targetNow.head;
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Vec) {
            var lengthNow = typeNow.length.now();
            if (lengthNow instanceof V.Add1) {
                return new V.Neutral(typeNow.entryType, new N.Head(targetNow.neutral));
            }
        }
    }
    throw new Error("invalid input for head ".concat(target));
}
function doTail(target) {
    var targetNow = target.now();
    if (targetNow instanceof V.VecCons) {
        return targetNow.tail;
    }
    else if (targetNow instanceof V.Neutral &&
        targetNow.type.now() instanceof V.Vec &&
        (targetNow.type.now().length).now() instanceof V.Add1) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Vec) {
            var lengthNow = typeNow.length.now();
            if (lengthNow instanceof V.Add1) {
                return new V.Neutral(new V.Vec(targetNow.type.now().entryType, targetNow.type.now().length.now().smaller), new N.Tail(targetNow.neutral));
            }
        }
    }
    throw new Error("invalid input for tail ".concat(target.prettyPrint()));
}
function indVecStepType(Ev, mot) {
    return new V.Pi("k", new V.Nat(), new utils_1.HigherOrderClosure(function (k) { return new V.Pi("e", Ev, new utils_1.HigherOrderClosure(function (e) { return new V.Pi("es", new V.Vec(Ev, k), new utils_1.HigherOrderClosure(function (es) { return new V.Pi("ih", doApp(doApp(mot, k), es), new utils_1.HigherOrderClosure(function (_) {
        return doApp(doApp(mot, new V.Add1(k)), new V.VecCons(e, es));
    })); })); })); }));
}
function doIndVec(len, vec, motive, base, step) {
    var lenNow = len.now();
    var vecNow = vec.now();
    if (lenNow instanceof V.Zero && vecNow instanceof V.VecNil) {
        return base;
    }
    else if (lenNow instanceof V.Add1 && vecNow instanceof V.VecCons) {
        return doApp(doApp(doApp(doApp(step, lenNow.smaller), vecNow.head), doTail(vec)), doIndVec(lenNow.smaller, vecNow.tail, motive, base, step));
    }
    else if (lenNow instanceof V.Neutral && vecNow instanceof V.Neutral
        && lenNow.type.now() instanceof V.Nat && vecNow.type.now() instanceof V.Vec) {
        var entryType_3 = vecNow.type.now().entryType;
        return new V.Neutral(doApp(doApp(motive, len), vec), new N.IndVec12(lenNow.neutral, vecNow.neutral, new N.Norm(new V.Pi("k", new V.Nat(), new utils_1.HigherOrderClosure(function (k) { return new V.Pi("es", new V.Vec(entryType_3, k), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); })), motive), new N.Norm(doApp(doApp(motive, new V.Zero), new V.VecNil()), base), new N.Norm(indVecStepType(vecNow.type.now().entryType, motive), step)));
    }
    else if ((0, utils_2.natEqual)(lenNow, len) && vecNow instanceof V.Neutral && (vecNow.type.now()) instanceof V.Vec) {
        var entryType_4 = vecNow.type.now().entryType;
        return new V.Neutral(doApp(doApp(motive, len), vec), new N.IndVec2(new N.Norm(new V.Nat(), len), vecNow.neutral, new N.Norm(new V.Pi("k", new V.Nat(), new utils_1.HigherOrderClosure(function (k) { return new V.Pi("es", new V.Vec(entryType_4, k), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); })), motive), new N.Norm(doApp(doApp(motive, new V.Nat()), new V.VecNil), base), new N.Norm(indVecStepType(entryType_4, motive), step)));
    }
    else {
        throw new Error("invalid input for indVec ".concat([len, vec, motive, base, step]));
    }
}
function doIndEither(target, motive, left, right) {
    var targetNow = target.now();
    if (targetNow instanceof V.Left) {
        return doApp(left, targetNow.value);
    }
    else if (targetNow instanceof V.Right) {
        return doApp(right, targetNow.value);
    }
    else if (targetNow instanceof V.Neutral) {
        var typeNow = targetNow.type.now();
        if (typeNow instanceof V.Either) {
            var leftType = typeNow.leftType;
            var rightType = typeNow.rightType;
            var motiveType = new V.Pi("x", new V.Either(leftType, rightType), new utils_1.HigherOrderClosure(function (x) { return new V.Universe(); }));
            return new V.Neutral(doApp(motive, target), new N.IndEither(targetNow.neutral, new N.Norm(motiveType, motive), new N.Norm(new V.Pi("x", leftType, new utils_1.HigherOrderClosure(function (x) { return doApp(motive, new V.Left(x)); })), left), new N.Norm(new V.Pi("x", rightType, new utils_1.HigherOrderClosure(function (x) { return doApp(motive, new V.Right(x)); })), right)));
        }
    }
    throw new Error("invalid input for indEither: ".concat([target, motive, left, right]));
}
