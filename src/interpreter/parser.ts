import { isNumericLiteral, Type } from 'typescript';
import { BindingSite, Srcloc, Loc, Src, TypedBinder, isVarName } from './basics';
import { Syntax, syntaxToLocation, Datum} from './locations';
import { match, P } from 'ts-pattern';

import { SchemeLexer } from './../transpiler/lexer/scheme-lexer';
import { SchemeParser } from './../transpiler/parser/scheme-parser';
import { Atomic, Expression, Extended } from "./../transpiler/types/nodes/scheme-node-types";
import { Location } from './../transpiler/types/location';

function syntaxToSrcLoc(syntax: Syntax): Loc {
  return syntaxToLocation(syntax);
}

function syntaxToDatum(syntax: Syntax): Symbol| number {
  return syntax.source;
}

function bindingSite(id: Syntax) {
  return new BindingSite(syntaxToSrcLoc(id), id.source as Symbol);
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

export type Element = Extended.List | Atomic.Symbol | Atomic.NumericLiteral;

function getValue(element: Element): string | Symbol | number{
  if (element instanceof Atomic.Symbol) {
    if(isVarName(Symbol(element.value))) {
      return Symbol(element.value);
    }
    return element.value;
  } else if (element instanceof Extended.List) {
    const arr = element.elements as Array<Element>;
    return getValue(arr[0]);
  } else if (element instanceof Atomic.NumericLiteral) {
    return Number(element.value);
  } else {
    throw new Error('Expected Symbol, but got' + element);
  }
}

export function syntaxParse(stx: string): Extended.List[] {
  const lexer = new SchemeLexer(stx);
  const parser = new SchemeParser('', lexer.scanTokens());
  const ast : Extended.List[] = parser.parse() as Extended.List[];
  return ast;
}

export function parsePie(stx: string): Src {
  const ast = syntaxParse(stx);
  const result = parseElements(ast[0]);
  return result;
}

function locToSyntax(src: Symbol, loc: Location): Syntax {
  return new Syntax(src, loc.start.line, loc.end.column);
}
function elementToSyntax(element: Element, loc: Location): Syntax {
  const val = getValue(element);
  if(typeof val === 'number') {
    return new Syntax(val, loc.start.line, loc.end.column);
  } else if (typeof val === 'symbol') {
    return new Syntax(val, loc.start.line, loc.end.column);
  } 
  return new Syntax(Symbol(getValue(element) as string), loc.start.line, loc.end.column);
}

function parseElements(element: Element) : Src{
  const result = match(getValue(element))
  .with('U', () => {
    return makeU(locToSyntax(Symbol('U'), (element as Extended.List).location));
  })
  .with('the', () => {
    let elements = (element as Extended.List).elements;
    let loc = (element as Extended.List).location;
    return makeThe(locToSyntax(Symbol('the'), loc), parseElements(elements[1] as Element), 
                   parseElements(elements[2] as Element));
  })
  .with('Nat', () => {
    return makeNat(locToSyntax(Symbol('Nat'), (element as Extended.List).location));
  })
  .with('->', () => {
    let elements = (element as Extended.List).elements;
    let A = parseElements(elements[1] as Element);
    let B = parseElements(elements[2] as Element);
    let C = elements.slice(3).map((x: Expression) => parseElements(x as Element));
    return makeArrow(locToSyntax(Symbol('->'), (element as Extended.List).location), [A, B, C]);
  })
  .with('→', () => {
    let elements = (element as Extended.List).elements;
    let A = parseElements(elements[1] as Element);
    let B = parseElements(elements[2] as Element);
    let C = elements.slice(3).map((x: Expression) => parseElements(x as Element));
    return makeArrow(locToSyntax(Symbol('->'), (element as Extended.List).location), [A, B, C]);
  })
  .with('zero', () => {
    return makeZero(locToSyntax(Symbol('zero'), (element as Extended.List).location));
  })
  .with('add1', () => {
    let elements = (element as Extended.List).elements;
    return makeAdd1(locToSyntax(Symbol('zero'), (element as Extended.List).location), parseElements(elements[1] as Element));
  })
  .with('λ', () => {
    let elements = (element as Extended.List).elements;
    let args = elements[1] as Extended.List;
    let body = elements[2] as Element;
    return makeLambda(
      locToSyntax(Symbol('λ'), (element as Extended.List).location),
      args.elements.map(
        (x: Expression) => 
          bindingSite(elementToSyntax(x as Element, (element as Extended.List).location))),
      parseElements(body)
    );                
  })
  .with('lambda', () => {
    return parseElements(new Extended.List(
      (element as Extended.List).location,
      [
        new Atomic.Symbol((element as Extended.List).location, 'λ'),
        ...((element as Extended.List).elements.slice(1))
      ]
    ));         
  })
  
  .with('Π', () => {
    return parseElements(new Extended.List(
      (element as Extended.List).location,
      [
        new Atomic.Symbol((element as Extended.List).location, 'Pi'),
        ...((element as Extended.List).elements.slice(1))
      ]
    )); 
  })
  .with('∏', () => {
    return parseElements(new Extended.List(
      (element as Extended.List).location,
      [
        new Atomic.Symbol((element as Extended.List).location, 'Pi'),
        ...((element as Extended.List).elements.slice(1))
      ]
    )); 
  })
  .with('Pi', () => {
    let elements = (element as Extended.List).elements;
    let args = elements[1] as Extended.List;
    let body = elements[2] as Element;
    
    // Get first binding pair
    let firstPair = args.elements[0] as Extended.List;
    let x0 = firstPair.elements[0] as Element;
    let A0 = firstPair.elements[1] as Element;
    
    // Process remaining binding pairs
    let remainingPairs = args.elements.slice(1) as Extended.List[];
    let processedPairs = remainingPairs.map(pair => {
        let x = pair.elements[0] as Element;
        let A = pair.elements[1] as Element;
        return [
            bindingSite(elementToSyntax(x, pair.location)),
            parseElements(A)
        ];
    });
    return makePi(
        locToSyntax(Symbol('Π'), (element as Extended.List).location),
        makeTypedBinders(
            [bindingSite(elementToSyntax(x0, firstPair.location)), 
             parseElements(A0)],
            processedPairs as TypedBinder[]
        ),
        parseElements(body)
    );
  })
  .with('Pair', () => {
    let elements = (element as Extended.List).elements;
    return makePair(locToSyntax(Symbol('Pair'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('cons', () => {
    let elements = (element as Extended.List).elements;
    return makeCons(locToSyntax(Symbol('cons'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('which-Nat', () => {
    let elements = (element as Extended.List).elements;
    return makeWhichNat(
      locToSyntax(Symbol('which-Nat'), (element as Extended.List).location),
      parseElements(elements[1] as Element),
      parseElements(elements[2] as Element),
      parseElements(elements[3] as Element)
    );
  })
  .with('iter-Nat', () => {
    let elements = (element as Extended.List).elements;
    return makeIterNat(
      locToSyntax(Symbol('iter-Nat'), (element as Extended.List).location),
      parseElements(elements[1] as Element),
      parseElements(elements[2] as Element),
      parseElements(elements[3] as Element)
    );
  })
  .with('rec-Nat', () => {
    let elements = (element as Extended.List).elements;
    return makeRecNat(
      locToSyntax(Symbol('rec-Nat'), (element as Extended.List).location),
      parseElements(elements[1] as Element),
      parseElements(elements[2] as Element),
      parseElements(elements[3] as Element)
    );
  })
  .with('ind-Nat', () => {
    let elements = (element as Extended.List).elements;
    return makeIndNat(
      locToSyntax(Symbol('ind-Nat'), (element as Extended.List).location),
      parseElements(elements[1] as Element),
      parseElements(elements[2] as Element),
      parseElements(elements[3] as Element),
      parseElements(elements[4] as Element)
    );
  })
  .with('Atom', () => {return makeAtom(locToSyntax(Symbol('Atom'), (element as Extended.List).location));})
  .with('Trivial', () => {return makeTrivial(locToSyntax(Symbol('Trivial'), (element as Extended.List).location));})
  .with('sole', () => {return makeSole(locToSyntax(Symbol('sole'), (element as Extended.List).location));})
  .with('List', () => {
    let elements = (element as Extended.List).elements;
    return makeList(locToSyntax(Symbol('List'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('nil', () => {
    return makeNil(locToSyntax(Symbol('nil'), (element as Extended.List).location));
  })
  .with('::', () => {
    let elements = (element as Extended.List).elements;
    return makeConsColons(locToSyntax(Symbol('::'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('ind-List', () => {
    let elements = (element as Extended.List).elements;
    return makeIndList(locToSyntax(Symbol('ind-List'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element), parseElements(elements[4] as Element));
  })
  .with('rec-List', () => {
    let elements = (element as Extended.List).elements;
    return makeRecList(locToSyntax(Symbol('rec-List'), (element as Extended.List).location), 
      parseElements(elements[1] as Element),
      parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element));
  })
  .with('Absurd', () => {
    return makeAbsurd(locToSyntax(Symbol('Absurd'), (element as Extended.List).location));
  })
  .with('ind-Absurd', () => {
    let elements = (element as Extended.List).elements;
    return makeIndAbsurd(locToSyntax(Symbol('ind-Absurd'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('=', () => {
    let elements = (element as Extended.List).elements;
    return makeEq(locToSyntax(Symbol('='), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element));
  })
  .with('same', () => {
    let elements = (element as Extended.List).elements;
    return makeSame(locToSyntax(Symbol('same'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('replace', () => {
    let elements = (element as Extended.List).elements;
    return makeReplace(locToSyntax(Symbol('replace'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element));
  })
  .with('trans', () => {
    let elements = (element as Extended.List).elements;
    return makeTrans(locToSyntax(Symbol('trans'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('cong', () => {
    let elements = (element as Extended.List).elements;
    return makeCong(locToSyntax(Symbol('cong'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('ind-=', () => {
    let elements = (element as Extended.List).elements;
    return makeIndEq(locToSyntax(Symbol('ind-='), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element));
  })
  .with('symm', () => {
    let elements = (element as Extended.List).elements;
    return makeSymm(locToSyntax(Symbol('symm'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('Vec', () => {
    let elements = (element as Extended.List).elements;
    return makeVec(locToSyntax(Symbol('Vec'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('vecnil', () => {
    return makeVecNil(locToSyntax(Symbol('vecnil'), (element as Extended.List).location));
  })
  .with('vec::', () => {
    let elements = (element as Extended.List).elements;
    return makeVecCons(locToSyntax(Symbol('vec::'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('head', () => {
    let elements = (element as Extended.List).elements;
    return makeHead(locToSyntax(Symbol('head'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('tail', () => {
    let elements = (element as Extended.List).elements;
    return makeTail(locToSyntax(Symbol('tail'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('ind-Vec', () => {
    let elements = (element as Extended.List).elements;
    return makeIndVec(locToSyntax(Symbol('ind-Vec'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element), parseElements(elements[4] as Element), 
      parseElements(elements[5] as Element));
  })
  .with('Either', () => {
    let elements = (element as Extended.List).elements;
    return makeEither(locToSyntax(Symbol('Either'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element));
  })
  .with('left', () => {
    let elements = (element as Extended.List).elements;
    return makeLeft(locToSyntax(Symbol('left'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('right', () => {
    let elements = (element as Extended.List).elements;
    return makeRight(locToSyntax(Symbol('right'), (element as Extended.List).location), 
      parseElements(elements[1] as Element));
  })
  .with('ind-Either', () => {
    let elements = (element as Extended.List).elements;
    return makeIndEither(locToSyntax(Symbol('ind-Either'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      parseElements(elements[3] as Element), parseElements(elements[4] as Element));
  })
  .with('TODO', () => {
    return makeTODO(locToSyntax(Symbol('TODO'), (element as Extended.List).location));
  })
  // TODO: function application not sure
  .with('function application', () => {
    let elements = (element as Extended.List).elements;
    return makeAp(locToSyntax(Symbol('function application'), (element as Extended.List).location), 
      parseElements(elements[1] as Element), parseElements(elements[2] as Element), 
      elements.slice(3).map((x: Expression) => parseElements(x as Element)));
  })
  .otherwise(() => {
    const val = getValue(element);
    if(typeof val === 'number') {
      return makeNatLiteral(locToSyntax(Symbol('a'), (element as Extended.List).location), val);
    } else if (typeof val === 'symbol') {
      return makeVarRef(locToSyntax(val, (element as Extended.List).location), val);
    } else {
      return makeTODO(locToSyntax(Symbol('TODO'), (element as Extended.List).location));
    }
  });
  return result;
}

export function parsePieDecl(element: Element) {
  const result = match(getValue(element))
  .with('claim', () => {
    let [_, x, type] = (element as Extended.List).elements;
    return ['claim', getValue(x as Element) as Datum, x.location,  parseElements(type as Element)];
  })
  .with('definition', () => {
    let [_, x, e] = (element as Extended.List).elements;
    return ['definition', getValue(x as Element) as Datum, x.location, parseElements(e as Element)];
  })
  .with('expression', () => {
    return ['expression', parseElements(element)];
  })
  .otherwise(() => {
    return ['TODO', getValue(element)];
  });
  return result;
}



