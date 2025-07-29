import { Syntax } from "../utils/locations";
import * as S from "../types/source";
import { syntaxToLocation } from "./parser";
import { SiteBinder, TypedBinder } from "../types/utils";
import { EliminateNatTactic, EliminateListTactic, ExactTactic, IntroTactic, Tactic, EliminateVecTactic, EliminateEqualTactic, ExistsTactic, LeftTactic, RightTactic, EliminateEitherTactic, SpiltTactic, EliminateAbsurdTactic } from "../tactics/tactics";


export function makeU(stx: Syntax): S.Source {

  return new S.Universe(syntaxToLocation(stx));

}



export function makeArrow(stx: Syntax, args: [S.Source, S.Source, S.Source[]]): S.Source {

  return new S.Arrow(syntaxToLocation(stx), args[0], args[1], args[2]);

}



export function makeNat(stx: Syntax): S.Source {

  return new S.Nat(syntaxToLocation(stx));

}



export function makeZero(stx: Syntax): S.Source {

  return new S.Zero(syntaxToLocation(stx));

}



export function makeAdd1(stx: Syntax, n: S.Source): S.Source {

  return new S.Add1(syntaxToLocation(stx), n);

}



export function makeLambda(stx: Syntax, binders: SiteBinder[], body: S.Source): S.Source {

  return new S.Lambda(syntaxToLocation(stx), binders, body);

}



export function makePi(stx: Syntax, binders: TypedBinder[], body: S.Source): S.Source {

  return new S.Pi(syntaxToLocation(stx), binders, body);

}



export function makeSigma(stx: Syntax, binders: TypedBinder[], body: S.Source): S.Source {

  return new S.Sigma(syntaxToLocation(stx), binders, body);

}



export function makeTypedBinders(head: TypedBinder, tail: TypedBinder[]): TypedBinder[] {

  return [head, ...tail];

}



export function makeApp(stx: Syntax, func: S.Source, arg0: S.Source, args: S.Source[]): S.Source {

  return new S.Application(syntaxToLocation(stx), func, arg0, args);

}



export function makeAtom(stx: Syntax): S.Source {

  return new S.Atom(syntaxToLocation(stx));

}



export function makeTrivial(stx: Syntax): S.Source {

  return new S.Trivial(syntaxToLocation(stx));

}



export function makeSole(stx: Syntax): S.Source {

  return new S.Sole(syntaxToLocation(stx));

}



export function makeList(stx: Syntax, type: S.Source): S.Source {

  return new S.List(syntaxToLocation(stx), type);

}



export function makeVec(stx: Syntax, type: S.Source, len: S.Source): S.Source {

  return new S.Vec(syntaxToLocation(stx), type, len);

}



export function makeEither(stx: Syntax, left: S.Source, right: S.Source): S.Source {

  return new S.Either(syntaxToLocation(stx), left, right);

}



export function makeNil(stx: Syntax): S.Source {

  return new S.Nil(syntaxToLocation(stx));

}



export function makeVecCons(stx: Syntax, head: S.Source, tail: S.Source): S.Source {

  return new S.VecCons(syntaxToLocation(stx), head, tail);

}



export function makeVecNil(stx: Syntax): S.Source {

  return new S.VecNil(syntaxToLocation(stx));

}



export function makeAbsurd(stx: Syntax): S.Source {

  return new S.Absurd(syntaxToLocation(stx));

}



export function makePair(stx: Syntax, head: S.Source, tail: S.Source): S.Source {

  return new S.Pair(syntaxToLocation(stx), head, tail);

}



export function makeCons(stx: Syntax, head: S.Source, tail: S.Source): S.Source {

  return new S.Cons(syntaxToLocation(stx), head, tail);

}



export function makeListCons(stx: Syntax, head: S.Source, tail: S.Source): S.Source {

  return new S.ListCons(syntaxToLocation(stx), head, tail);

}



export function makeThe(stx: Syntax, type: S.Source, value: S.Source): S.Source {

  return new S.The(syntaxToLocation(stx), type, value);

}



export function makeIndAbsurd(stx: Syntax, head: S.Source, tail: S.Source): S.Source {

  return new S.IndAbsurd(syntaxToLocation(stx), head, tail);

}



export function makeTrans(stx: Syntax, from: S.Source, to: S.Source): S.Source {

  return new S.Trans(syntaxToLocation(stx), from, to);

}



export function makeCong(stx: Syntax, from: S.Source, to: S.Source): S.Source {

  return new S.Cong(syntaxToLocation(stx), from, to);

}



export function makeIndEqual(stx: Syntax, target: S.Source, mot: S.Source, base: S.Source): S.Source {

  return new S.IndEqual(syntaxToLocation(stx), target, mot, base);

}



export function makeWhichNat(stx: Syntax, target: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.WhichNat(syntaxToLocation(stx), target, base, step);

}



export function makeIterNat(stx: Syntax, target: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.IterNat(syntaxToLocation(stx), target, base, step);

}



export function makeRecNat(stx: Syntax, target: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.RecNat(syntaxToLocation(stx), target, base, step);

}



export function makeIndNat(stx: Syntax, target: S.Source, mot: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.IndNat(syntaxToLocation(stx), target, mot, base, step);

}



export function makeRecList(stx: Syntax, target: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.RecList(syntaxToLocation(stx), target, base, step);

}



export function makeIndList(stx: Syntax, target: S.Source, mot: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.IndList(syntaxToLocation(stx), target, mot, base, step);

}



export function makeIndEither(stx: Syntax, target: S.Source, mot: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.IndEither(syntaxToLocation(stx), target, mot, base, step);

}



export function makeIndVec(stx: Syntax, length: S.Source, target: S.Source, mot: S.Source, base: S.Source, step: S.Source): S.Source {

  return new S.IndVec(syntaxToLocation(stx), length, target, mot, base, step);

}



export function makeEqual(stx: Syntax, type: S.Source, left: S.Source, right: S.Source): S.Source {

  return new S.Equal(syntaxToLocation(stx), type, left, right);

}



export function makeReplace(stx: Syntax, target: S.Source, mot: S.Source, base: S.Source): S.Source {

  return new S.Replace(syntaxToLocation(stx), target, mot, base);

}



export function makeSymm(stx: Syntax, equality: S.Source): S.Source {

  return new S.Symm(syntaxToLocation(stx), equality);

}



export function makeHead(stx: Syntax, vec: S.Source): S.Source {

  return new S.Head(syntaxToLocation(stx), vec);

}



export function makeTail(stx: Syntax, vec: S.Source): S.Source {

  return new S.Tail(syntaxToLocation(stx), vec);

}



export function makeSame(stx: Syntax, type: S.Source): S.Source {

  return new S.Same(syntaxToLocation(stx), type);

}



export function makeLeft(stx: Syntax, value: S.Source): S.Source {

  return new S.Left(syntaxToLocation(stx), value);

}



export function makeRight(stx: Syntax, value: S.Source): S.Source {

  return new S.Right(syntaxToLocation(stx), value);

}



export function makeCar(stx: Syntax, pair: S.Source): S.Source {

  return new S.Car(syntaxToLocation(stx), pair);

}



export function makeCdr(stx: Syntax, pair: S.Source): S.Source {

  return new S.Cdr(syntaxToLocation(stx), pair);

}



export function makeQuote(stx: Syntax, quoted: string): S.Source {

  return new S.Quote(syntaxToLocation(stx), quoted);

}



export function makeVarRef(stx: Syntax, ref: string): S.Source {

  return new S.Name(syntaxToLocation(stx), ref);

}



export function makeNatLiteral(stx: Syntax, num: string): S.Source {

  return new S.Number(syntaxToLocation(stx), Number(num));

}



export function makeTODO(stx: Syntax): S.Source {

  return new S.TODO(syntaxToLocation(stx));

}



export function makeIntro(stx: Syntax, name?: string): Tactic {

  return new IntroTactic(syntaxToLocation(stx), name);

}



export function makeExact(stx: Syntax, expr: S.Source): Tactic {

  return new ExactTactic(syntaxToLocation(stx), expr);

}

export function makeExists(stx: Syntax, value: S.Source, name?: string): Tactic {

  return new ExistsTactic(syntaxToLocation(stx), value, name);

}



export function makeElimNat(stx: Syntax, target: string, motive: S.Source): Tactic {

  return new EliminateNatTactic(syntaxToLocation(stx), target, motive);

}

export function makeElimList(stx: Syntax, target: string, motive: S.Source): Tactic {

  return new EliminateListTactic(syntaxToLocation(stx), target, motive);

}

export function makeElimVec(stx: Syntax, target: string, motive: S.Source, length: S.Source): Tactic {

  return new EliminateVecTactic(syntaxToLocation(stx), target, motive, length);

}

export function makeElimEqual(stx: Syntax, target: string, motive: S.Source): Tactic {

  return new EliminateEqualTactic(syntaxToLocation(stx), target, motive);
  
}

export function makeLeftTactic(stx: Syntax): Tactic {

  return new LeftTactic(syntaxToLocation(stx))

}

export function makeRightTactic(stx: Syntax): Tactic {

  return new RightTactic(syntaxToLocation(stx))

}

export function makeElimEither(stx: Syntax, target: string, motive: S.Source): Tactic {

  return new EliminateEitherTactic(syntaxToLocation(stx), target, motive);

}

export function makeSplit(stx: Syntax) {

  return new SpiltTactic(syntaxToLocation(stx));

}

export function makeElimAbsurd(stx: Syntax, target: string, motive: S.Source): Tactic {

  return new EliminateAbsurdTactic(syntaxToLocation(stx), target, motive);

}

