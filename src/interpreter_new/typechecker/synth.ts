
import * as Core from "../types/core";
import * as Source from "../types/source";
import { go, Perhaps } from "../types/utils";
import { SourceSyntaxVisitor } from "../visitors/basics_visitors";
import { locationToSrcLoc } from '../locations';

export class Synth implements SourceSyntaxVisitor {
  constructor() {
  }

  visitThe(node: Source.The): void {
    throw new Error("Method not implemented.");
  }
  visitU(node: Source.U): void {
    return new stop(node.locationToSrcLoc())
  }
  visitNat(node: Source.Nat): Perhaps<Core.Core> {
    return new go(new Core.The(new Core.Universe(), new Core.Nat()));
  }
  visitZero(node: Zero): void {
    throw new Error("Method not implemented.");
  }
  visitName(node: Name): void {
    throw new Error("Method not implemented.");
  }
  visitAtom(node: Atom): void {
    throw new Error("Method not implemented.");
  }
  visitQuote(node: Quote): void {
    throw new Error("Method not implemented.");
  }
  visitAdd1(node: Add1): void {
    throw new Error("Method not implemented.");
  }
  visitWhichNat(node: WhichNat): void {
    throw new Error("Method not implemented.");
  }
  visitIterNat(node: IterNat): void {
    throw new Error("Method not implemented.");
  }
  visitRecNat(node: RecNat): void {
    throw new Error("Method not implemented.");
  }
  visitIndNat(node: IndNat): void {
    throw new Error("Method not implemented.");
  }
  visitArrow(node: Arrow): void {
    throw new Error("Method not implemented.");
  }
  visitPi(node: Pi): void {
    throw new Error("Method not implemented.");
  }
  visitLambda(node: Lambda): void {
    throw new Error("Method not implemented.");
  }
  visitSigma(node: Sigma): void {
    throw new Error("Method not implemented.");
  }
  visitPair(node: Pair): void {
    throw new Error("Method not implemented.");
  }
  visitCons(node: Cons): void {
    throw new Error("Method not implemented.");
  }
  visitCar(node: Car): void {
    throw new Error("Method not implemented.");
  }
  visitCdr(node: Cdr): void {
    throw new Error("Method not implemented.");
  }
  visitTrivial(node: Trivial): void {
    throw new Error("Method not implemented.");
  }
  visitSole(node: Sole): void {
    throw new Error("Method not implemented.");
  }
  visitNil(node: Nil): void {
    throw new Error("Method not implemented.");
  }
  visitNumber(node: Number): void {
    throw new Error("Method not implemented.");
  }
  visitConsList(node: ConsList): void {
    throw new Error("Method not implemented.");
  }
  visitRecList(node: RecList): void {
    throw new Error("Method not implemented.");
  }
  visitIndList(node: IndList): void {
    throw new Error("Method not implemented.");
  }
  visitAbsurd(node: Absurd): void {
    throw new Error("Method not implemented.");
  }
  visitIndAbsurd(node: IndAbsurd): void {
    throw new Error("Method not implemented.");
  }
  visitEqual(node: Equal): void {
    throw new Error("Method not implemented.");
  }
  visitSame(node: Same): void {
    throw new Error("Method not implemented.");
  }
  visitReplace(node: Replace): void {
    throw new Error("Method not implemented.");
  }
  visitTrans(node: Trans): void {
    throw new Error("Method not implemented.");
  }
  visitCong(node: Cong): void {
    throw new Error("Method not implemented.");
  }
  visitSymm(node: Symm): void {
    throw new Error("Method not implemented.");
  }
  visitIndEqual(node: IndEqual): void {
    throw new Error("Method not implemented.");
  }
  visitVec(node: Vec): void {
    throw new Error("Method not implemented.");
  }
  visitVecNil(node: VecNil): void {
    throw new Error("Method not implemented.");
  }
  visitVecCons(node: VecCons): void {
    throw new Error("Method not implemented.");
  }
  visitHead(node: Head): void {
    throw new Error("Method not implemented.");
  }
  visitTail(node: Tail): void {
    throw new Error("Method not implemented.");
  }
  visitIndVec(node: IndVec): void {
    throw new Error("Method not implemented.");
  }
  visitEither(node: Either): void {
    throw new Error("Method not implemented.");
  }
  visitLeft(node: Left): void {
    throw new Error("Method not implemented.");
  }
  visitRight(node: Right): void {
    throw new Error("Method not implemented.");
  }
  visitIndEither(node: IndEither): void {
    throw new Error("Method not implemented.");
  }
  visitTODO(node: TODO): void {
    throw new Error("Method not implemented.");
  }
  visitApplication(node: Application): void {
    throw new Error("Method not implemented.");
  }

}