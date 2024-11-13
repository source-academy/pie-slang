import {
  Src,
  SrcStx,
  initCtx,
  ctxToEnv,
  BindingSite,
  MetaVar,
  go,
} from './basics';
import 'jest';
import {
  valOf,
  PIType,
} from './normalize';
import { } from './typechecker';

import {
  rep
} from './rep';

import * as util from 'util';

import { Location, Syntax } from './locations';
import { SchemeLexer } from './transpiler/lexer/scheme-lexer';
import { SchemeParser } from './transpiler/parser/scheme-parser';
import { Token } from "./transpiler/types/tokens/token";
import { Atomic, Expression, Extended } from "./transpiler/types/nodes/scheme-node-types";
import {parsePie} from './parser';

describe("just test", () => {
  it("nah", () => {
    const input = '(which-Nat 1 2 (lambda (x) x))'
    // const input = '(λ (z) z)';
    console.log(util.inspect(parsePie(input), false, null, true /* enable colors */));
  });
});

const nl = new Location(new Syntax(Symbol('a'), 0, 0,), true);

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualWithSymbols(expected: any): R;
    }
  }
}

expect.extend({
  toEqualWithSymbols(received, expected) {
    const pass = this.equals(received, expected, [
      (a, b) => {
        if (typeof a === 'symbol' && typeof b === 'symbol') {
          return a.description === b.description;
        }
        return undefined; // Use default equality check
      }
    ]);

    if (pass) {
      return {
        message: () => `expected ${received} not to equal ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to equal ${expected}`,
        pass: false,
      };
    }
  }
});

describe("valOf", () => {
  it("should return ZERO", () => {
    const result0 = valOf(ctxToEnv(initCtx), ['the', 'Nat', 'zero'])
    expect(result0).toEqual('ZERO');
  });
});

describe("lambda(var) var", () => {
  it("should return a pie expression", () => {
    // const result = rep(initCtx, new Src(nl, ['the', new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), []]),
    //   new Src(nl, ['λ', [new BindingSite(nl, Symbol('myVar'))], new Src(nl, Symbol('x'))])]));
    const result = parsePie('(the (-> Nat Nat) (λ (myVar) myVar))');
    const actual = new go(['the', ['Π', [[Symbol('x'), 'Nat']], 'Nat'], ['λ', [Symbol('myVar')], Symbol('myVar')]]);
    expect(rep(initCtx, result)).toEqualWithSymbols(actual);
  });

  it("case lambda(z) => z", () => {
    const z = Symbol('z');  // Create single instance
    const x = Symbol('x');

    const src = parsePie('(the (-> Nat Nat) (λ (z) z))');

    const actual = new go([
      'the',
      ['Π', [[x, 'Nat']], 'Nat'],
      ['λ', [z], z]
    ]);

    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });

  it("case lambda(x x) => x", () => {
    // const src = new Src(nl, ['the',
    //   new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), [new Src(nl, 'Nat')]]),
    //   new Src(nl, ['λ', [new BindingSite(nl, Symbol('x')), new BindingSite(nl, Symbol('x'))],
    //     new Src(nl, Symbol('x'))])]);
    const src = parsePie('(the (-> Nat Nat Nat) (λ (x x) x))');
    const actual = new go(['the', ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']], ['λ', [Symbol('x')], ['λ', [Symbol('x₁')], Symbol('x₁')]]]);
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });
  it("case which-nat1", () => {
    // (@ #<location> (list 'which-Nat (@ #<location> 1) (@ #<location> 2) (@ #<location> (list 'λ (list (binder #<location> 'x)) (@ #<location> 'x)))))
    // const src = new Src(nl, [
    //   'which-Nat',
    //   new Src(nl, 1),
    //   new Src(nl, 2),
    //   new Src(nl, ['λ', [new BindingSite(nl, Symbol('x'))], new Src(nl, Symbol('x'))])]
    // );
    const src = parsePie('(which-Nat 1 2 (lambda (x) x))');
    const actual = new go(['the', 'Nat', 'zero']);
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });
  it("case which-nat2", () => {
    // (@ #<location> (list 'which-Nat (@ #<location> 0) (@ #<location> 2) (@ #<location> (list 'λ (list (binder #<location> 'x)) (@ #<location> 'x)))))
    // const src = new Src(nl, [
    //   'which-Nat',
    //   new Src(nl, 0),
    //   new Src(nl, 2),
    //   new Src(nl, ['λ', [new BindingSite(nl, Symbol('x'))], new Src(nl, Symbol('x'))])]
    // );
    const src = parsePie('(which-Nat 0 2 (lambda (x) x))');
    const actual = new go(['the', 'Nat', ['add1', ['add1', 'zero']]]);
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });
  /*
  (@
 #<location>
 (list
  'the
  (@ #<location> (list '-> (@ #<location> 'Nat) (@ #<location> 'Nat) (@ #<location> 'Nat)))
  (@
   #<location>
   (list
    'λ
    (list (binder #<location> 'x) (binder #<location> 'y))
    (@
     #<location>
     (list
      'ind-Nat
      (@ #<location> 'x)
      (@ #<location> (list 'λ (list (binder #<location> 'x)) (@ #<location> 'Nat)))
      (@ #<location> 'y)
      (@ #<location> (list 'λ (list (binder #<location> 'n-1) (binder #<location> 'ih)) (@ #<location> (list 'add1 (@ #<location> 'ih)))))))))))
  */
  it("case ind-nat1", () => {
    const src = new Src(nl,
      [
        'the',
        new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), [new Src(nl, 'Nat')]]),
        new Src(nl, ['λ', [new BindingSite(nl, Symbol('x')), new BindingSite(nl, Symbol('y'))],
          new Src(nl, ['ind-Nat',
            new Src(nl, Symbol('x')),
            new Src(nl, ['λ', [new BindingSite(nl, Symbol('x'))], new Src(nl, 'Nat')]),
            new Src(nl, Symbol('y')),
            new Src(nl, ['λ', [new BindingSite(nl, Symbol('n-1')), new BindingSite(nl, Symbol('ih'))], new Src(nl, ['add1', new Src(nl, Symbol('ih'))])])
          ])
        ])
      ]
    );
    const actual = new go(
      [
        'the',
        ['Π', [[Symbol('x'), 'Nat'], [Symbol('x₁'), 'Nat']], 'Nat'],
        ['λ',
          [Symbol('x')],
          ['λ',
            [Symbol('y')],
            ['ind-Nat',
              Symbol('x'),
              ['λ', [Symbol('x₁')], 'Nat'],
              Symbol('y'),
              ['λ', [Symbol('n-1')], ['λ', [Symbol('ih')], ['add1', 'ih']]]
            ]
          ]
        ]
      ]
    );
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });
});
