import {
    Source,
    isSource,
    SiteBinder,
    TypedBinder,
    SourceSyntax,
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
    isPieKeywords
  } from "../basics";

abstract class Visitor { 

}
class SourceSyntaxVisitor extends Visitor {
    public visitThe(node: SS_The): void { }
    public visitU(node: SS_U): void { }
    public visitNat(node: SS_Nat): void { }
    public visitZero(node: SS_Zero): void { }
    public visitName(node: SS_Name): void { }
    public visitAtom(node: SS_Atom): void { }
    public visitQuote(node: SS_Quote): void { }
    public visitAdd1(node: SS_Add1): void { }
    public visitWhichNat(node: SS_WhichNat): void { }
    public visitIterNat(node: SS_IterNat): void { }
    public visitRecNat(node: SS_RecNat): void { }
    public visitIndNat(node: SS_IndNat): void { }
    public visitArrow(node: SS_Arrow): void { }
    public visitPi(node: SS_Pi): void { }
    public visitLambda(node: SS_Lambda): void { }
    public visitSigma(node: SS_Sigma): void { }
    public visitPair(node: SS_Pair): void { }
    public visitCons(node: SS_Cons): void { }
    public visitCar(node: SS_Car): void { }
    public visitCdr(node: SS_Cdr): void { }
    public visitTrivial(node: SS_Trivial): void { }
    public visitSole(node: SS_Sole): void { }
    public visitNil(node: SS_Nil): void { }
    public visitNumber(node: SS_Number): void { }
    public visitConsList(node: SS_ConsList): void { }
    public visitRecList(node: SS_RecList): void { }
    public visitIndList(node: SS_IndList): void { }
    public visitAbsurd(node: SS_Absurd): void { }
    public visitIndAbsurd(node: SS_IndAbsurd): void { }
    public visitEqual(node: SS_Equal): void { }
    public visitSame(node: SS_Same): void { }
    public visitReplace(node: SS_Replace): void { }
    public visitTrans(node: SS_Trans): void { }
    public visitCong(node: SS_Cong): void { }
    public visitSymm(node: SS_Symm): void { }
    public visitIndEqual(node: SS_IndEqual): void { }
    public visitVec(node: SS_Vec): void { }
    public visitVecNil(node: SS_VecNil): void { }
    public visitVecCons(node: SS_VecCons): void { }
    public visitHead(node: SS_Head): void { }
    public visitTail(node: SS_Tail): void { }
    public visitIndVec(node: SS_IndVec): void { }
    public visitEither(node: SS_Either): void { }
    public visitLeft(node: SS_Left): void { }
    public visitRight(node: SS_Right): void { }
    public visitIndEither(node: SS_IndEither): void { }
    public visitTODO(node: SS_TODO): void { }
    public visitApplication(node: SS_Application): void { }
}

export { SourceSyntaxVisitor }