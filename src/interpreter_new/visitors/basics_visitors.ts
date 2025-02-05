import {
  C_U,
  C_Nat,
  C_Zero,
  C_Symbol,
  C_Atom,
  C_Trivial,
  C_Absurd,
  C_The,
  C_Add1,
  C_WhichNat,
  C_IterNat,
  C_RecNat,
  C_IndNat,
  C_Pi,
  C_Lambda,
  C_Application,
  C_Quote,
  C_Sigma,
  C_Cons,
  C_Car,
  C_Cdr,
  C_List,
  C_ConsList,
  C_Nil,
  C_RecList,
  C_IndList,
  C_IndAbsurd,
  C_Equal,
  C_Same,
  C_Replace,
  C_Trans,
  C_Cong,
  C_Symm,
  C_IndEqual,
  C_Vec,
  C_VecCons,
  C_VecNil,
  C_Head,
  C_Tail,
  C_IndVec,
  C_Either,
  C_Left,
  C_Right,
  C_IndEither,
  C_TODO,
} from "../types/core";

import {
  SS_The,
  SS_U,
  SS_Nat,
  SS_Zero,
  SS_Name,
  SS_Atom,
  SS_Quote,
  SS_Add1,
  SS_WhichNat,
  SS_IterNat,
  SS_RecNat,
  SS_IndNat,
  SS_Arrow,
  SS_Pi,
  SS_Lambda,
  SS_Sigma,
  SS_Pair,
  SS_Cons,
  SS_Car,
  SS_Cdr,
  SS_Trivial,
  SS_Sole,
  SS_Nil,
  SS_Number,
  SS_ConsList,
  SS_RecList,
  SS_IndList,
  SS_Absurd,
  SS_IndAbsurd,
  SS_Equal,
  SS_Same,
  SS_Replace,
  SS_Trans,
  SS_Cong,
  SS_Symm,
  SS_IndEqual,
  SS_Vec,
  SS_VecNil,
  SS_VecCons,
  SS_Head,
  SS_Tail,
  SS_IndVec,
  SS_Either,
  SS_Left,
  SS_Right,
  SS_IndEither,
  SS_TODO,
  SS_Application,

} from "./../types/source"

import * as Value from "../types/value"

export interface SourceSyntaxVisitor {
  visitThe(node: SS_The): void;
  visitU(node: SS_U): void;
  visitNat(node: SS_Nat): void;
  visitZero(node: SS_Zero): void;
  visitName(node: SS_Name): void;
  visitAtom(node: SS_Atom): void;
  visitQuote(node: SS_Quote): void;
  visitAdd1(node: SS_Add1): void;
  visitWhichNat(node: SS_WhichNat): void;
  visitIterNat(node: SS_IterNat): void;
  visitRecNat(node: SS_RecNat): void;
  visitIndNat(node: SS_IndNat): void;
  visitArrow(node: SS_Arrow): void;
  visitPi(node: SS_Pi): void;
  visitLambda(node: SS_Lambda): void;
  visitSigma(node: SS_Sigma): void;
  visitPair(node: SS_Pair): void;
  visitCons(node: SS_Cons): void;
  visitCar(node: SS_Car): void;
  visitCdr(node: SS_Cdr): void;
  visitTrivial(node: SS_Trivial): void;
  visitSole(node: SS_Sole): void;
  visitNil(node: SS_Nil): void;
  visitNumber(node: SS_Number): void;
  visitConsList(node: SS_ConsList): void;
  visitRecList(node: SS_RecList): void;
  visitIndList(node: SS_IndList): void;
  visitAbsurd(node: SS_Absurd): void;
  visitIndAbsurd(node: SS_IndAbsurd): void;
  visitEqual(node: SS_Equal): void;
  visitSame(node: SS_Same): void;
  visitReplace(node: SS_Replace): void;
  visitTrans(node: SS_Trans): void;
  visitCong(node: SS_Cong): void;
  visitSymm(node: SS_Symm): void;
  visitIndEqual(node: SS_IndEqual): void;
  visitVec(node: SS_Vec): void;
  visitVecNil(node: SS_VecNil): void;
  visitVecCons(node: SS_VecCons): void;
  visitHead(node: SS_Head): void;
  visitTail(node: SS_Tail): void;
  visitIndVec(node: SS_IndVec): void;
  visitEither(node: SS_Either): void;
  visitLeft(node: SS_Left): void;
  visitRight(node: SS_Right): void;
  visitIndEither(node: SS_IndEither): void;
  visitTODO(node: SS_TODO): void;
  visitApplication(node: SS_Application): void;
}

export interface CoreVisitor {
  visitThe(expr: C_The): void;
  visitU(expr: C_U): void;
  visitNat(expr: C_Nat): void;
  visitZero(expr: C_Zero): void;
  visitSymbol(expr: C_Symbol): void;
  visitAdd1(expr: C_Add1): void;
  visitWhichNat(expr: C_WhichNat): void;
  visitIterNat(expr: C_IterNat): void;
  visitRecNat(expr: C_RecNat): void;
  visitIndNat(expr: C_IndNat): void;
  visitPi(expr: C_Pi): void;
  visitLambda(expr: C_Lambda): void;
  visitAtom(expr: C_Atom): void;
  visitQuote(expr: C_Quote): void;
  visitSigma(expr: C_Sigma): void;
  visitCons(expr: C_Cons): void;
  visitCar(expr: C_Car): void;
  visitCdr(expr: C_Cdr): void;
  visitConsList(expr: C_ConsList): void;
  visitNil(expr: C_Nil): void;
  visitList(expr: C_List): void;
  visitRecList(expr: C_RecList): void;
  visitIndList(expr: C_IndList): void;
  visitAbsurd(expr: C_Absurd): void;
  visitTrivial(expr: C_Trivial): void;
  visitIndAbsurd(expr: C_IndAbsurd): void;
  visitEqual(expr: C_Equal): void;
  visitSame(expr: C_Same): void;
  visitReplace(expr: C_Replace): void;
  visitTrans(expr: C_Trans): void;
  visitCong(expr: C_Cong): void;
  visitSymm(expr: C_Symm): void;
  visitIndEqual(expr: C_IndEqual): void;
  visitVec(expr: C_Vec): void;
  visitVecCons(expr: C_VecCons): void;
  visitVecNil(expr: C_VecNil): void;
  visitHead(expr: C_Head): void;
  visitTail(expr: C_Tail): void;
  visitIndVec(expr: C_IndVec): void;
  visitEither(expr: C_Either): void;
  visitLeft(expr: C_Left): void;
  visitRight(expr: C_Right): void;
  visitIndEither(expr: C_IndEither): void;
  visitTODO(expr: C_TODO): void;
  visitApplication(expr: C_Application): void;
}

export interface ValueVisitor<R> {
  visitUniverse(): R;
  visitNat(): R;
  visitZero(): R;
  visitAdd1(value: Value.Add1Value): R;
  visitQuote(value: Value.QuoteValue): R;
  visitAtom(): R;
  visitPi(value: Value.PiValue): R;
  visitLam(value: Value.LamValue): R;
  visitSigma(value: Value.SigmaValue): R;
  visitCons(value: Value.ConsValue): R;
  visitTrivial(): R;
  visitSole(): R;
  visitList(value: Value.ListValue): R;
  visitListCons(value: Value.ListConsValue): R;
  visitNil(): R;
  visitAbsurd(): R;
  visitEqual(value: Value.EqualValue): R;
  visitSame(value: Value.SameValue): R;
  visitVec(value: Value.VecValue): R;
  visitVecNil(): R;
  visitVecCons(value: Value.VecConsValue): R;
  visitEither(value: Value.EitherValue): R;
  visitLeft(value: Value.LeftValue): R;
  visitRight(value: Value.RightValue): R;
  visitNeu(value: Value.NeuValue): R;
  visitDelay(value: Value.DelayValue): R;
  // visitMetaVar(value: Value.MetaVar): R;
}
