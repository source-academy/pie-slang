import * as V from "../types/value";
/**
 *
 * @param operator
 * @param operand
 * @returns result of applying operator to operand
 */
export declare function doApp(operator: V.Value, operand: V.Value): V.Value;
/**
 *
 * @param target
 * @param baseType
 * @param base
 * @param step
 * @returns result of applying whichNat eliminator
 */
export declare function doWhichNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doIterNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doRecNat(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doIndNat(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doCar(pair: V.Value): V.Value;
export declare function doCdr(pair: V.Value): V.Value;
export declare function doIndList(target: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doRecList(target: V.Value, baseType: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doIndAbsurd(target: V.Value, motive: V.Value): V.Value;
export declare function doReplace(target: V.Value, motive: V.Value, base: V.Value): V.Value;
export declare function doTrans(target1: V.Value, target2: V.Value): V.Value;
export declare function doCong(target: V.Value, base: V.Value, func: V.Value): V.Value;
export declare function doSymm(target: V.Value): V.Value;
export declare function doIndEqual(target: V.Value, motive: V.Value, base: V.Value): V.Value;
export declare function doHead(target: V.Value): V.Value;
export declare function doTail(target: V.Value): V.Value;
export declare function indVecStepType(Ev: V.Value, mot: V.Value): V.Value;
export declare function doIndVec(len: V.Value, vec: V.Value, motive: V.Value, base: V.Value, step: V.Value): V.Value;
export declare function doIndEither(target: V.Value, motive: V.Value, left: V.Value, right: V.Value): V.Value;
export declare function doEliminator(name: string, target: V.Value, motive: V.Value, methods: V.Value[]): V.Value;
//# sourceMappingURL=evaluator.d.ts.map