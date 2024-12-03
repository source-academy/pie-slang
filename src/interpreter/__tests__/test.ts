import 'jest';
import * as util from 'util';
import {
  initCtx,
  ctxToEnv,
  go,
} from '../basics';
import { valOf } from '../normalize';
import { rep } from '../rep';
import {parsePie, syntaxParse} from '../parser';

// describe("test parsing", () => {
//   it("Test parsing result 1", () => {
//       const input = '(claim x (-> Nat Nat))';
//       console.log(util.inspect(syntaxParse(input), false, null, true));
//       }
//     );
//   }
// );

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

// describe("valOf", () => {
//   it("should return ZERO", () => {
//     const result0 = valOf(ctxToEnv(initCtx), ['the', 'Nat', 'zero']);
//     expect(result0).toEqual('ZERO');

//   });
// });

// describe("lambda(var) var", () => {
//   it("should return a pie expression", () => {
//     const result = parsePie('(the (-> Nat Nat) (λ (myVar) myVar))');
//     const actual = new go(['the', ['Π', [[Symbol('x'), 'Nat']], 'Nat'], ['λ', [Symbol('myVar')], Symbol('myVar')]]);
//     expect(rep(initCtx, result)).toEqualWithSymbols(actual);
//   });

//   it("case lambda(z) => z", () => {
//     const z = Symbol('z'); // Create single instance
//     const x = Symbol('x');

//     const src = parsePie('(the (-> Nat Nat) (λ (z) z))');

//     const actual = new go([
//       'the',
//       ['Π', [[x, 'Nat']], 'Nat'],
//       ['λ', [z], z]
//     ]);

//     expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   });

//   it("case lambda(x x) => x", () => {
//     const src = parsePie('(the (-> Nat Nat Nat) (λ (x x) x))');
//     const actual = new go(['the', ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']], ['λ', [Symbol('x')], ['λ', [Symbol('x₁')], Symbol('x₁')]]]);
//     expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   });
//   it("case which-nat1", () => {
//     // (@ #<location> (list 'which-Nat (@ #<location> 1) (@ #<location> 2) (@ #<location> (list 'λ (list (binder #<location> 'x)) (@ #<location> 'x)))))
//     // const src = new Src(nl, [
//     //   'which-Nat',
//     //   new Src(nl, 1),
//     //   new Src(nl, 2),
//     //   new Src(nl, ['λ', [new BindingSite(nl, Symbol('x'))], new Src(nl, Symbol('x'))])]
//     // );
//     const src = parsePie('(which-Nat 1 2 (lambda (x) x))');
//     const actual = new go(['the', 'Nat', 'zero']);
//     expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   });
//   it("case which-nat2", () => {
//     // (@ #<location> (list 'which-Nat (@ #<location> 0) (@ #<location> 2) (@ #<location> (list 'λ (list (binder #<location> 'x)) (@ #<location> 'x)))))
//     // const src = new Src(nl, [
//     //   'which-Nat',
//     //   new Src(nl, 0),
//     //   new Src(nl, 2),
//     //   new Src(nl, ['λ', [new BindingSite(nl, Symbol('x'))], new Src(nl, Symbol('x'))])]
//     // );
//     const src = parsePie('(which-Nat 0 2 (lambda (x) x))');
//     const actual = new go(['the', 'Nat', ['add1', ['add1', 'zero']]]);
//     expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   });
//   /*
//   (@
//  #<location>
//  (list
//   'the
//   (@ #<location> (list '-> (@ #<location> 'Nat) (@ #<location> 'Nat) (@ #<location> 'Nat)))
//   (@
//    #<location>
//    (list
//     'λ
//     (list (binder #<location> 'x) (binder #<location> 'y))
//     (@
//      #<location>
//      (list
//       'ind-Nat
//       (@ #<location> 'x)
//       (@ #<location> (list 'λ (list (binder #<location> 'x)) (@ #<location> 'Nat)))
//       (@ #<location> 'y)
//       (@ #<location> (list 'λ (list (binder #<location> 'n-1) (binder #<location> 'ih)) (@ #<location> (list 'add1 (@ #<location> 'ih)))))))))))
//   */
//   it("case which-nat3", () => {
//     const src = parsePie(
//       `(the
//         (-> Nat (-> Nat Nat) Nat)
//         (lambda (x f) (which-Nat 2 x f))
//       )`
//     );
//     const actual = new go(['the',
//       ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('x₁'), ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']], 'Nat']]],
//       ['λ', [Symbol('x')], ['λ', [Symbol('f')], [Symbol('f'), ['add1', 'zero']]]]
//     ]);
//   });
//   it("case PI1", () => {
//     //(the (Pi ((A U)) U) (lambda (B) B))
//     const src = parsePie(
//       `(the
//         (Pi ((A U)) U)
//         (lambda (B) B)
//       )`
//     );
//     const actual = new go(['the', ['Π', [[Symbol('A'), 'U']], 'U'], ['λ', [Symbol('B')], Symbol('B')]]);
//     expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   });
//   it("case PI2", () => {
//     // (the (Pi ((A U) (a A)) A) (lambda (B b) b))
//     const src = parsePie(
//       `(the
//         (Pi ((A U) (a A)) A)
//         (lambda (B b) b)
//       )`
//     );
//     const actual = new go(['the', ['Π', [[Symbol('A'), 'U']], ['Π', [[Symbol('a'), Symbol('A')]], Symbol('A')]], ['λ', [Symbol('B')], ['λ', [Symbol('b')], Symbol('b')]]]);
//     // expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   });
//   /* it("case ind-nat1", () => {
//     const src = parsePie(
//       `(the
//         (-> Nat (-> (-> Nat Nat) Nat) (-> Nat Nat))
//         (lambda (x f) (ind-Nat x (lambda (x) Nat) f))
//       )`
//     );
//     const actual = new go(
//       [
//         'the',
//         ['Π', [[Symbol('x'), 'Nat'], [Symbol('x₁'), 'Nat']], 'Nat'],
//         ['λ',
//           [Symbol('x')],
//           ['λ',
//             [Symbol('y')],
//             ['ind-Nat',
//               Symbol('x'),
//               ['λ', [Symbol('x₁')], 'Nat'],
//               Symbol('y'),
//               ['λ', [Symbol('n-1')], ['λ', [Symbol('ih')], ['add1', 'ih']]]
//             ]
//           ]
//         ]
//       ]
//     );
//     console.log('RESULT', util.inspect(rep(initCtx, src)));
//     //expect(rep(initCtx, src)).toEqualWithSymbols(actual);
//   }); */
// });

describe("demo", () => {

  it("Pie demo", () => {
    const src = parsePie('(-> Nat Nat Nat Nat Nat)');
    const actual = new go(['the', 'U', ['Π', [[Symbol('x'), 'Nat']], 
                                         ['Π', [[Symbol('x₁'), 'Nat']], 
                                           ['Π', [[Symbol('x₂'), 'Nat']], 
                                             ['Π', [[Symbol('x₃'), 'Nat']], 
                                                  'Nat']]]]]);
    console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
                                                  
    });

  it("Sigma demo", () => {
    const src = parsePie(
                        `(the (-> Trivial
                                         (Pair Trivial Trivial))
                                     (lambda (x)
                                       (cons x x)))`
                                       );
    const actual = new go(
        ['the', ['Π', [[Symbol('x'), 'Trivial']], 
        ['Σ', [[Symbol('x₁'), 'Trivial']], 'Trivial']], 
        ['λ', [Symbol('x')],['cons', Symbol('sole'), Symbol('sole')]]]);
    console.log('wcnm', util.inspect(rep(initCtx, src), false, null, true));
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });

});
