import * as Source from "./../types/source"


export interface SourceVisitor {
  visitList(arg0: Source.List): unknown;
  visitThe(node: Source.The): void;
  visitU(node: Source.Universe): void;
  visitNat(node: Source.Nat): void;
  visitZero(node: Source.Zero): void;
  visitName(node: Source.Name): void;
  visitAtom(node: Source.Atom): void;
  visitQuote(node: Source.Quote): void;
  visitAdd1(node: Source.Add1): void;
  visitWhichNat(node: Source.WhichNat): void;
  visitIterNat(node: Source.IterNat): void;
  visitRecNat(node: Source.RecNat): void;
  visitIndNat(node: Source.IndNat): void;
  visitArrow(node: Source.Arrow): void;
  visitPi(node: Source.Pi): void;
  visitLambda(node: Source.Lambda): void;
  visitSigma(node: Source.Sigma): void;
  visitPair(node: Source.Pair): void;
  visitCons(node: Source.Cons): void;
  visitCar(node: Source.Car): void;
  visitCdr(node: Source.Cdr): void;
  visitTrivial(node: Source.Trivial): void;
  visitSole(node: Source.Sole): void;
  visitNil(node: Source.Nil): void;
  visitNumber(node: Source.Number): void;
  visitConsList(node: Source.ListCons): void;
  visitRecList(node: Source.RecList): void;
  visitIndList(node: Source.IndList): void;
  visitAbsurd(node: Source.Absurd): void;
  visitIndAbsurd(node: Source.IndAbsurd): void;
  visitEqual(node: Source.Equal): void;
  visitSame(node: Source.Same): void;
  visitReplace(node: Source.Replace): void;
  visitTrans(node: Source.Trans): void;
  visitCong(node: Source.Cong): void;
  visitSymm(node: Source.Symm): void;
  visitIndEqual(node: Source.IndEqual): void;
  visitVec(node: Source.Vec): void;
  visitVecNil(node: Source.VecNil): void;
  visitVecCons(node: Source.VecCons): void;
  visitHead(node: Source.Head): void;
  visitTail(node: Source.Tail): void;
  visitIndVec(node: Source.IndVec): void;
  visitEither(node: Source.Either): void;
  visitLeft(node: Source.Left): void;
  visitRight(node: Source.Right): void;
  visitIndEither(node: Source.IndEither): void;
  visitTODO(node: Source.TODO): void;
  visitApplication(node: Source.Application): void;
}