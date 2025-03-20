import 'jest';

import { Parser } from '../parser/parser';
import * as util from 'util';
import { go } from '../types/utils';
import { initCtx } from '../utils/context';
import { normType, represent } from '../typechecker/represent';
import * as C from '../types/core';
import { prettyPrint } from '../unparser/pretty';

const parser = new Parser();

function normalize(src: string): string {
  return src.replace(/\s+/g, ' ').trim();
}

describe("demo", () => {

  it("Pie demo", () => {
    const src = parser.parsePie('(-> Nat Nat Nat Nat Nat)');
    
    const actual = new go(new C.The(new C.Universe, new C.Pi('x', new C.Nat, 
      new C.Pi('x₁', new C.Nat, 
        new C.Pi('x₂', new C.Nat, 
          new C.Pi('x₃', new C.Nat, new C.Nat)))))
    )
    // console.log('result: ', util.inspect(represent(initCtx, src), false, null, true));
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    expect(represent(initCtx, src)).toEqual(actual);                                      
    }
  );

  it("Sigma demo", () => {
    const src = parser.parsePie(
                        `(the (-> Trivial
                                    (Pair Trivial Trivial))
                                    (lambda (x)
                                    (cons x x)))`
                                       );
    const actual = new go(
      new C.The(
        new C.Pi('x', new C.Trivial(), new C.Sigma('x₁', new C.Trivial(), new C.Trivial())),
        new C.Lambda('x', new C.Cons(new C.Sole(), new C.Sole()))
      )
    );
    console.log((represent(initCtx, src) as go<C.Core>).result.prettyPrint());
    expect(represent(initCtx, src)).toEqual(actual);
  });

  it("Lambda demo", () => {
    const src = normalize(`(the (-> (List Nat) Nat)
                             (lambda (ns)
                               (ind-List
                                ns
                                (λ (_) Nat)
                                zero
                                (lambda (x y z)
                                  (ind-Nat
                                   x
                                   (lambda (n)
                                     Nat)
                                   z
                                   (lambda (_ q)
                                     (add1 q)))))))`);
    const actual = `(the
                 (Π ((x (List Nat)))
                   Nat)
                 (λ (ns)
                   (ind-List
                    ns
                    (λ (_) Nat)
                    zero
                    (λ (x)
                      (λ (y) (λ (z) (ind-Nat x (λ (n) Nat) z (λ (_) (λ (q) (add1 q)))))))))`
    expect(normalize((represent(initCtx, parsePie(src)) as go<C.Core>).result.prettyPrint())).toEqual(actual.replace(/\s+/g, ' ').trim());
  });

});

describe("Pie language tests", () => {
  
  it("Simple lambda function", () => {
    const src = parsePie('(the (-> Nat Nat) (λ (my-var) my-var))');
    const actual = new go(new C.The(new C.Pi('x', new C.Nat, new C.Nat), 
                                  new C.Lambda('my-var', new C.VarName('my-var'))));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    expect(represent(initCtx, src)).toEqual(actual);
  });

  it("Lambda with parameter named z", () => {
    const src = parsePie('(the (-> Nat Nat) (λ (z) z))');
    const actual = new go(new C.The(
      new C.Pi('x', new C.Nat(), new C.Nat()),
      new C.Lambda('z', new C.VarName('z'))
    ));
    const context = new Map();
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    expect(represent(context, src)).toEqual(actual);
  });

  it("which-Nat with non-zero argument", () => {
    const src = parsePie('(which-Nat 1 1 (lambda (x) x))');
    const actual = new go(new C.The(new C.Nat(), new C.Zero()));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("which-Nat with zero argument", () => {
    const src = parsePie('(which-Nat 0 2 (lambda (x) x))');
    const actual = new go(new C.The(new C.Nat(), new C.Add1(new C.Add1(new C.Zero()))));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });
});

function parsePie(src: string) {
  return parser.parsePie(src);
}

describe("Higher-order function tests", () => {
  
  it("Function that takes a function and an argument", () => {
    const src = parsePie('(the (-> (-> Nat Nat) Nat Nat) (lambda (f x) (f x)))');
    // const actual = new go(['the', 
    //                       ['Π', [[Symbol('x'), ['Π', [[Symbol('x'), 'Nat']], 'Nat']]], 
    //                             ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']], 
    //                       ['λ', [Symbol('f')], ['λ', [Symbol('x')], [Symbol('f'), Symbol('x')]]]]);
    const actual = new go(
      new C.The(
        new C.Pi(
          'x', new C.Pi('x', new C.Nat(), new C.Nat()),
          new C.Pi(
            'x₁', new C.Nat(), 
            new C.Nat()
          )
        ),
        new C.Lambda('f', new C.Lambda('x', new C.Application(new C.VarName('f'), new C.VarName('x'))))
      )
    );
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("which-Nat with constant base case and function step case", () => {
    const src = parsePie('(the (-> Nat (-> Nat Nat) Nat) (lambda (x f) (which-Nat 2 x f)))');
    // const actual = new go(['the', 
    //                       ['Π', [[Symbol('x'), 'Nat']], 
    //                             ['Π', [[Symbol('x₁'), ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']]], 'Nat']], 
    //                       ['λ', [Symbol('x')], 
    //                             ['λ', [Symbol('f')], 
    //                                  [Symbol('f'), ['add1', 'zero']]]]]);
    const actual = new go(
      new C.The(
        new C.Pi(
          'x', new C.Nat(), 
          new C.Pi(
            'x₁', new C.Pi('x₁', new C.Nat(), new C.Nat()), 
            new C.Nat()
          )
        ),
        new C.Lambda('x', 
          new C.Lambda('f', 
            new C.Application(new C.VarName('f'), new C.Add1(new C.Zero()))
          )
        )
      )
    );
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("which-Nat with variable condition", () => {
    const src = parsePie('(the (-> Nat (-> Nat Nat) Nat) (lambda (x f) (which-Nat x (add1 (add1 zero)) f)))');
    // const actual = new go(['the', 
    //                       ['Π', [[Symbol('x'), 'Nat']], 
    //                             ['Π', [[Symbol('x₁'), ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']]], 'Nat']], 
    //                       ['λ', [Symbol('x')], 
    //                             ['λ', [Symbol('f')], 
    //                                  ['which-Nat', Symbol('x'), 
    //                                               ['the', 'Nat', ['add1', ['add1', 'zero']]], 
    //                                               ['λ', [Symbol('n')], [Symbol('f'), Symbol('n')]]]]]]);
    const actual = new go(
      new C.The(
        new C.Pi(
          'x', new C.Nat(), 
          new C.Pi(
            'x₁', new C.Pi('x₁', new C.Nat(), new C.Nat()), 
            new C.Nat()
          )
        ),
        new C.Lambda('x', 
          new C.Lambda('f', 
            new C.WhichNat(
              new C.VarName('x'),
              new C.The(new C.Nat(), new C.Add1(new C.Add1(new C.Zero()))),
              new C.Lambda('n', new C.Application(new C.VarName('f'), new C.VarName('n')))
            )
          )
        )
      )
    );
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });
});

describe("Advanced Pie language features", () => {
  
  it("Dependent type with Pi", () => {
    const src = parsePie('(the (Pi ((A U)) U) (lambda (B) B))');

    const actual = new go(
      new C.The(
        new C.Pi(
          'A', new C.Universe(), 
          new C.Universe()
        ),
        new C.Lambda('B', new C.VarName('B'))
      )
    );
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Dependent type with multiple parameters", () => {
    const src = parsePie('(the (Pi ((A U) (a A)) A) (lambda (B b) b))');

    const actual = new go(
      new C.The(
        new C.Pi(
          'A', new C.Universe(), 
          new C.Pi(
            'a', 
            new C.VarName('A'), 
            new C.VarName('A')
          )
        ),
        new C.Lambda('B', new C.Lambda('b', new C.VarName('b')))));
    const context = new Map();      
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));                
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    expect(represent(context, src)).toEqual(actual);
  });

  it("ind-Nat with constant values", () => {
    const src = parsePie('(ind-Nat (add1 (add1 zero)) (lambda (x) Nat) (add1 zero) (lambda (n-1 ih) (add1 ih)))');
    const actual = new go(new C.The(new C.Nat(), new C.Add1(new C.Add1(new C.Add1(new C.Zero())))));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Addition function using ind-Nat", () => {
    const src = parsePie('(the (-> Nat Nat Nat) (lambda (x y) (ind-Nat x (lambda (x) Nat) y (lambda (n-1 ih) (add1 ih)))))');

    const actual = new go(
      new C.The(
        new C.Pi(
          'x', new C.Nat(), 
          new C.Pi(
            'x₁', new C.Nat(), 
            new C.Nat()
          )
        ),
        new C.Lambda(
          'x', 
          new C.Lambda(
            'y', 
            new C.IndNat(
              new C.VarName('x'), 
              new C.Lambda('x₁', new C.Nat()), 
              new C.VarName('y'), 
              new C.Lambda(
                'n-1', 
                new C.Lambda(
                  'ih', 
                  new C.Add1(new C.VarName('ih'))
                )
              )
            )
          )
        )
      )
    );
    //console.log('result_IND_NAT', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    expect(represent(context, src)).toEqual(actual);
  });

  it("Function type as a universe type", () => {
    const src = parsePie('(the U (-> Nat Nat))');
    //const actual = new go(['the', 'U', ['Π', [[Symbol('x'), 'Nat']], 'Nat']]);
    const actual = new go(new C.The(new C.Universe(), new C.Pi('x', new C.Nat(), new C.Nat())));
    const context = new Map();
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    expect(represent(context, src)).toEqual(actual);
  });

  it("Pi type with explicit parameter names", () => {
    const src = parsePie('(Π ((x Nat) (y Nat)) Nat)');
    //const actual = new go(['the', 'U', ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('y'), 'Nat']], 'Nat']]]);
    const actual = new go(new C.The(new C.Universe(), new C.Pi('x', new C.Nat(), new C.Pi('y', new C.Nat(), new C.Nat()))));
    const context = new Map();
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    expect(represent(context, src)).toEqual(actual);
  });

  it("normType with Nat", () => {
    const src = parsePie('Nat');
    const actual = new go(new C.Nat());
    const context = new Map();
    //console.log('result', util.inspect(normType(initCtx, src), false, null, true));
    expect(normType(context, src)).toEqual(actual);
  });
});

describe("Atom and Pair tests", () => {
  
  it("Quote literal", () => {
    const src = parsePie("'a");
    const actual = new go(new C.The(new C.Atom(), new C.Quote('a')));
    const context = new Map();
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    expect(represent(context, src)).toEqual(actual);
  });

  it("Explicit atom type", () => {
    const src = parsePie("(the Atom 'a)");
    //const actual = new go(['the', 'Atom', "'a"]);
    const actual = new go(new C.The(new C.Atom(), new C.Quote('a')));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    expect(represent(context, src)).toEqual(actual);
  });

  it("Atom type", () => {
    const src = parsePie("Atom");
    //const actual = new go(['the', 'U', 'Atom']);
    const actual = new go(new C.The(new C.Universe(), new C.Atom()));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Pair type", () => {
    const src = parsePie("(Pair Atom Atom)");
    //const actual = new go(['the', 'U', ['Σ', [[Symbol('a'), 'Atom']], 'Atom']]);
    const actual = new go(new C.The(new C.Universe(), new C.Sigma('a', new C.Atom(), new C.Atom())));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Sigma type with multiple fields", () => {
    const src = parsePie("(Σ ((x Nat) (y Atom)) Nat)");
    //const actual = new go(['the', 'U', ['Σ', [[Symbol('x'), 'Nat']], ['Σ', [[Symbol('y'), 'Atom']], 'Nat']]]);
    const actual = new go(
      new C.The(
        new C.Universe(), 
        new C.Sigma('x', new C.Nat(), new C.Sigma('y', new C.Atom(), new C.Nat()))
      )
    );
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Pair construction", () => {
    const src = parsePie("(the (Pair Atom Atom) (cons 'olive 'oil))");
    //const actual = new go(['the', ['Σ', [[Symbol('x'), 'Atom']], 'Atom'], ['cons', "'olive", "'oil"]]);
    const actual = new go(new C.The(new C.Sigma('x', new C.Atom(), new C.Atom()), new C.Cons(new C.Quote('olive'), new C.Quote('oil'))));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Pair first projection", () => {
    const src = parsePie("(car (the (Pair Atom Atom) (cons 'olive 'oil)))");
    //const actual = new go(['the', 'Atom', "'olive"]);
    const actual = new go(new C.The(new C.Atom(), new C.Quote('olive')));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Pair second projection", () => {
    const src = parsePie("(cdr (the (Pair Atom Atom) (cons 'olive 'oil)))");
    //const actual = new go(['the', 'Atom', "'oil"]);
    const actual = new go(new C.The(new C.Atom(), new C.Quote('oil')));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    expect(represent(context, src)).toEqual(actual);
  });

  it("Complex dependent function with pair", () => {
    const src = parsePie(`(the (Π ((f (-> Nat U))
                          (p (Σ ((n Nat))
                              (f n))))
                        (f (car p)))
                      (λ (f p)
                        (cdr p)))`);
    // const actual = new go([
    //   'the',
    //   ['Π', [[Symbol('f'), ['Π', [[Symbol('x'), 'Nat']], 'U']]],
    //        ['Π', [[Symbol('p'), ['Σ', [[Symbol('n'), 'Nat']], [Symbol('f'), Symbol('n')]]]],
    //             [Symbol('f'), ['car', Symbol('p')]]]],
    //   ['λ', [Symbol('f')], ['λ', [Symbol('p')], ['cdr', Symbol('p')]]]
    // ]);
    const actual = new go(
      new C.The(
        new C.Pi(
          'f', new C.Pi('x', new C.Nat(), new C.Universe()),
            new C.Pi(
              'p', new C.Sigma('n', new C.Nat(), new C.Application(new C.VarName('f'), new C.VarName('n'))),
              new C.Application(new C.VarName('f'), new C.Car(new C.VarName('p'))))),
              new C.Lambda('f', new C.Lambda('p', new C.Cdr(new C.VarName('p'))))));
    //console.log('result', util.inspect(represent(initCtx, src), false, null, true));
    const context = new Map();
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    expect(represent(context, src)).toEqual(actual);
  });

  it("Normalize sigma type", () => {
    const src = parsePie("(Σ ((x Nat) (y Nat)) Nat)");
    //const actual = new go(['Σ', [[Symbol('x'), 'Nat']], ['Σ', [[Symbol('y'), 'Nat']], 'Nat']]);
    const actual = new go(new C.Sigma('x', new C.Nat(), new C.Sigma('y', new C.Nat(), new C.Nat())));
    //console.log('result', util.inspect(normType(initCtx, src), false, null, true));
    const context = new Map();
    console.log((prettyPrint((represent(initCtx, src) as go<C.Core>).result)));
    expect(normType(context, src)).toEqual(actual);
  });
}); 
