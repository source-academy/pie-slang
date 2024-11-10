import { Type } from 'typescript';
import { BindingSite, Srcloc, Loc, Src, TypedBinder } from './basics';
import { Syntax, syntaxToLocation } from './locations';
import { match, P } from 'ts-pattern';

import { SchemeLexer } from './transpiler/lexer/scheme-lexer';
import { SchemeParser } from './transpiler/parser/scheme-parser';
import { Token } from "./transpiler/types/tokens/token";
import { Atomic, Expression, Extended,  } from "./transpiler/types/nodes/scheme-node-types";

function syntaxToSrcLoc(syntax: Syntax): Loc {
  return syntaxToLocation(syntax);
}

function bindingSite(id: Syntax) {
  return new BindingSite(syntaxToSrcLoc(id), id.datum);
}

function makeU(loc: Syntax) {
  return new Src(syntaxToSrcLoc(loc), 'U');
}

function makeArrow(loc: Syntax, abc : [Src, Src, Src[]]) {
  return new Src(syntaxToSrcLoc(loc), ['->', ...abc]);
}

function makeNat(loc: Syntax) {
  return new Src(syntaxToSrcLoc(loc), 'Nat');
}

function makeZero(loc: Syntax) {
  return new Src(syntaxToSrcLoc(loc), 'zero');
}

function makeAdd1(loc: Syntax, n: Src) {
  return new Src(syntaxToSrcLoc(loc), ['add1', n]);
}

function makeLambda(loc: Syntax, xs: BindingSite[], body: Src) {
  return new Src(syntaxToSrcLoc(loc), ['λ', xs, body]);
}

function makePi(loc: Syntax, args: TypedBinder[], body: Src) {
  return new Src(syntaxToSrcLoc(loc), ['Π', args, body]);
}

function makeSigma(loc: Syntax, args: TypedBinder[], body: Src) {
  return new Src(syntaxToSrcLoc(loc), ['Σ', args, body]);
}

function makeTypedBinders(A: TypedBinder, B: TypedBinder[]) : TypedBinder[] {
  return [A, ...B];
}

function makeAp(loc : Syntax, rator: Src, rand0: Src, rands: Src[]) {
  return new Src(syntaxToSrcLoc(loc), [rator, rand0, rands]);
}

function makeAtom(loc: Syntax) {
  return new Src(syntaxToSrcLoc(loc), 'Atom');
}

function makeTrivial(loc: Syntax) {
  return new Src(syntaxToSrcLoc(loc), 'Trivial');
}

function makeSole(loc: Syntax) {
  return new Src(syntaxToSrcLoc(loc), 'sole');
}

function makeList(loc: Syntax, E: Src) {
  return new Src(syntaxToSrcLoc(loc), ['List', E]);
}

function makeVec(loc: Syntax, E: Src, len: Src) {
  return new Src(syntaxToSrcLoc(loc), ['Vec', E, len]);
}

function makeEither(loc: Syntax, L: Src, R: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['Either', L, R]);
}

function makeNil(loc: Syntax): Src {
  return new Src(syntaxToSrcLoc(loc), 'nil');
}

function makeConsColons(loc: Syntax, x: Src, xs: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['::', x, xs]);
}

function makeVecCons(loc: Syntax, x: Src, xs: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['vec::', x, xs]);
}

function makeVecNil(loc: Syntax): Src {
  return new Src(syntaxToSrcLoc(loc), 'vecnil');
}

function makeAbsurd(loc: Syntax): Src {
  return new Src(syntaxToSrcLoc(loc), 'Absurd');
}

function makePair(loc: Syntax, A: Src, B: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['Pair', A, B]);
}

function makeCons(loc: Syntax, a: Src, d: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['cons', a, d]);
}

function makeThe(loc: Syntax, a: Src, d: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['the', a, d]);
}

function makeIndAbsurd(loc: Syntax, a: Src, d: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['ind-Absurd', a, d]);
}

function makeTrans(loc: Syntax, p1: Src, p2: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['trans', p1, p2]);
}

function makeCong(loc: Syntax, p1: Src, p2: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['cong', p1, p2]);
}

function makeIndEq(loc: Syntax, tgt: Src, mot: Src, base: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['ind-=', tgt, mot, base]);
}

function makeWhichNat(loc: Syntax, e1: Src, e2: Src, e3: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['which-Nat', e1, e2, e3]);
}

function makeIterNat(loc: Syntax, e1: Src, e2: Src, e3: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['iter-Nat', e1, e2, e3]);
}

function makeRecNat(loc: Syntax, e1: Src, e2: Src, e3: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['rec-Nat', e1, e2, e3]);
}

function makeIndNat(loc: Syntax, e1: Src, e2: Src, e3: Src, e4: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['ind-Nat', e1, e2, e3, e4]);
}

function makeRecList(loc: Syntax, e1: Src, e2: Src, e3: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['rec-List', e1, e2, e3]);
}

function makeIndList(loc: Syntax, e1: Src, e2: Src, e3: Src, e4: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['ind-List', e1, e2, e3, e4]);
}

function makeIndEither(loc: Syntax, e1: Src, e2: Src, e3: Src, e4: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['ind-Either', e1, e2, e3, e4]);
}

function makeIndVec(loc: Syntax, e1: Src, e2: Src, e3: Src, e4: Src, e5: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['ind-Vec', e1, e2, e3, e4, e5]);
}

function makeEq(loc: Syntax, e1: Src, e2: Src, e3: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['=', e1, e2, e3]);
}

function makeReplace(loc: Syntax, e1: Src, e2: Src, e3: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['replace', e1, e2, e3]);
}

function makeSymm(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['symm', e]);
}

function makeHead(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['head', e]);
}

function makeTail(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['tail', e]);
}

function makeSame(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['same', e]);
}

function makeLeft(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['left', e]);
}

function makeRight(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['right', e]);
}

function makeCar(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['car', e]);
}

function makeCdr(loc: Syntax, e: Src): Src {
  return new Src(syntaxToSrcLoc(loc), ['cdr', e]);
}

function makeQuote(loc: Syntax, a: Symbol): Src {
  return new Src(syntaxToSrcLoc(loc), ['quote', a]);
}

function makeVarRef(loc: Syntax, a: Symbol): Src {
  return new Src(syntaxToSrcLoc(loc), a);
}

function makeNatLiteral(loc: Syntax, n: number): Src {
  return new Src(syntaxToSrcLoc(loc), n);
}

function makeTODO(loc: Syntax): Src {
  return new Src(syntaxToSrcLoc(loc), 'TODO');
}

function parsePie(stx:string): Src {
  const lexer = new SchemeLexer(stx);
  const parser = new SchemeParser('', lexer.scanTokens());
  const ast : Extended.List[] = parser.parse() as Extended.List[];
  const pieAST = match(ast[0].elements.values)
    .with

}