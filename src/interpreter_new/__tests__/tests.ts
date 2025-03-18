import 'jest';

import {Parser} from '../parser';
import * as util from 'util';
import {go} from '../types/utils';
import {Context, initCtx} from '../types/contexts';
import {rep} from '../rep';
import * as Core from '../types/core';

const parser = new Parser();

describe("demo", () => {

  it("Pie demo", () => {
    const src = parser.parsePie('(-> Nat Nat Nat Nat Nat)');
    
    const actual = new go([new Core.The(new Core.Universe, new Core.Pi('x', new Core.Nat, 
      new Core.Pi('x₁', new Core.Nat, 
        new Core.Pi('x₂', new Core.Nat, 
          new Core.Pi('x₃', new Core.Nat, new Core.Nat)))))
    ])
    // console.log('result: ', util.inspect(rep(initCtx, src), false, null, true));
    expect(rep(initCtx, src)).toEqual(actual);                                      
    });

  it("Sigma demo", () => {
    const src = parser.parsePie(
                        `(the (-> Trivial
                                    (Pair Trivial Trivial))
                                    (lambda (x)
                                    (cons x x)))`
                                       );
    const actual = new go(
        ['the', ['Π', [[Symbol('x'), 'Trivial']], 
        ['Σ', [[Symbol('x₁'), 'Trivial']], 'Trivial']], 
        ['λ', [Symbol('x')],['cons', Symbol('sole'), Symbol('sole')]]]);
    console.log(util.inspect(rep(initCtx, src), false, null, true));
    expect(rep(initCtx, src)).toEqual(actual);
  });

});

describe("Pie language tests", () => {
  
  // it("Simple lambda function", () => {
  //   const src = parsePie('(the (-> Nat Nat) (λ (my-var) my-var))');
  //   const actual = new go([new Core.The(new Core.Pi('x₁', new Core.Nat, new Core.Nat), 
  //                                 new Core.Lambda('my-var₁', new Core.VarName('my-var₁')))]);
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   expect(rep(initCtx, src)).toEqual(actual);
  // });

  // it("Lambda with parameter named z", () => {
  //   const src = parsePie('(the (-> Nat Nat) (λ (z) z))');
  //   const actual = new go([new Core.The(
  //     new Core.Pi('x₁', new Core.Nat(), new Core.Nat()),
  //     new Core.Lambda('z₁', new Core.VarName('z₁'))
  //   )]);
  //   const context = new Map();
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   expect(rep(context, src)).toEqual(actual);
  // });

  it("which-Nat with non-zero argument", () => {
    const src = parsePie('(which-Nat 1 1 (lambda (x) x))');
    const actual = new go([new Core.The(new Core.Nat(), new Core.Zero())]);
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  it("which-Nat with zero argument", () => {
    const src = parsePie('(which-Nat 0 2 (lambda (x) x))');
    const actual = new go([new Core.The(new Core.Nat(), new Core.Add1(new Core.Add1(new Core.Zero())))]);
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
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
    const actual = new go([new Core.The(new Core.Pi('x₁', new Core.Nat(), new Core.Nat()),
                          new Core.Lambda('f₁', new Core.Lambda('x₁', new Core.Application(new Core.VarName('f₁'), new Core.VarName('x₁')))))]);
    
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  it("which-Nat with constant base case and function step case", () => {
    const src = parsePie('(the (-> Nat (-> Nat Nat) Nat) (lambda (x f) (which-Nat 2 x f)))');
    // const actual = new go(['the', 
    //                       ['Π', [[Symbol('x'), 'Nat']], 
    //                             ['Π', [[Symbol('x₁'), ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']]], 'Nat']], 
    //                       ['λ', [Symbol('x')], 
    //                             ['λ', [Symbol('f')], 
    //                                  [Symbol('f'), ['add1', 'zero']]]]]);
    const actual = new go([new Core.The(new Core.Pi('x₁', new Core.Nat(), new Core.Pi('x₂', new Core.Pi('x₂', new Core.Nat(), new Core.Nat()), new Core.Nat())),
                          new Core.Lambda('x₁', new Core.Lambda('f₁', new Core.Application(new Core.VarName('f₁'), new Core.Add1(new Core.Zero())))))]);

    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
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
    const actual = new go([new Core.The(new Core.Pi('x₁', new Core.Nat(), new Core.Pi('x₂', new Core.Pi('x₂', new Core.Nat(), new Core.Nat()), new Core.Nat())),
                          new Core.Lambda('x₁', new Core.Lambda('f₁', new Core.Application(new Core.VarName('f₁'), new Core.VarName('x₁')))))]);
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });
});

describe("Advanced Pie language features", () => {
  
  // it("Dependent type with Pi", () => {
  //   const src = parsePie('(the (Pi ((A U)) U) (lambda (B) B))');
  //   // const actual = new go(['the', 
  //   //                       ['Π', [[Symbol('A'), 'U']], 'U'], 
  //   //                       ['λ', [Symbol('B')], Symbol('B')]]);
  //   const actual = new go([new Core.The(new Core.Pi('A₁', new Core.Universe(), new Core.Universe()),
  //                         new Core.Lambda('B₁', new Core.VarName('B₁')))]);
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   const context = new Map();
  //   expect(rep(context, src)).toEqual(actual);
  // });

  // it("Dependent type with multiple parameters", () => {
  //   const src = parsePie('(the (Pi ((A U) (a A)) A) (lambda (B b) b))');
  //   // const actual = new go(['the', 
  //   //                       ['Π', [[Symbol('A'), 'U']], ['Π', [[Symbol('a'), Symbol('A')]], Symbol('A')]], 
  //   //                       ['λ', [Symbol('B')], ['λ', [Symbol('b')], Symbol('b')]]]);
  //   const actual = new go([new Core.The(new Core.Pi('x₁', new Core.Universe(), new Core.Pi('x₂', new Core.VarName('x₁'), new Core.VarName('x₁'))),
  //                         new Core.Lambda('B₁', new Core.Lambda('b₁', new Core.VarName('b₁'))))]);
  //   const context = new Map();                      
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   expect(rep(context, src)).toEqual(actual);
  // });

  it("ind-Nat with constant values", () => {
    const src = parsePie('(ind-Nat (add1 (add1 zero)) (lambda (x) Nat) (add1 zero) (lambda (n-1 ih) (add1 ih)))');
    const actual = new go([new Core.The(new Core.Nat(), new Core.Add1(new Core.Add1(new Core.Zero())))]);
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  // it("Addition function using ind-Nat", () => {
  //   const src = parsePie('(the (-> Nat Nat Nat) (lambda (x y) (ind-Nat x (lambda (x) Nat) y (lambda (n-1 ih) (add1 ih)))))');
  //   // const actual = new go(['the', 
  //   //                       ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']], 
  //   //                       ['λ', [Symbol('x')], 
  //   //                             ['λ', [Symbol('y')], 
  //   //                                  ['ind-Nat', Symbol('x'), 
  //   //                                             ['λ', [Symbol('x₁')], 'Nat'], 
  //   //                                             Symbol('y'), 
  //   //                                             ['λ', [Symbol('n-1')], 
  //   //                                                  ['λ', [Symbol('ih')], 
  //   //                                                       ['add1', Symbol('ih')]]]]]]]);
  //   const actual = new go([new Core.The(new Core.Pi('x₁', new Core.Nat(), new Core.Pi('x₂', new Core.Nat(), new Core.Nat())),
  //                         new Core.Lambda('x₁', new Core.Lambda('y₁', new Core.Application(new Core.VarName('y₁'), new Core.Add1(new Core.Zero())))))]);
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   const context = new Map();
  //   expect(rep(context, src)).toEqual(actual);
  // });

  // it("Function type as a universe type", () => {
  //   const src = parsePie('(the U (-> Nat Nat))');
  //   //const actual = new go(['the', 'U', ['Π', [[Symbol('x'), 'Nat']], 'Nat']]);
  //   const actual = new go([new Core.The(new Core.Universe(), new Core.Pi('x', new Core.Nat(), new Core.Nat()))]);
  //   const context = new Map();
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   expect(rep(context, src)).toEqual(actual);
  // });

  // it("Pi type with explicit parameter names", () => {
  //   const src = parsePie('(Π ((x Nat) (y Nat)) Nat)');
  //   //const actual = new go(['the', 'U', ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('y'), 'Nat']], 'Nat']]]);
  //   const actual = new go([new Core.The(new Core.Universe(), new Core.Pi('x', new Core.Nat(), new Core.Pi('y', new Core.Nat(), new Core.Nat())))]);
  //   const context = new Map();
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   expect(rep(context, src)).toEqual(actual);
  // });

  // it("normType with Nat", () => {
  //   const src = parsePie('Nat');
  //   const actual = new go(new Core.Nat());
  //   const context = new Map();
  //   //console.log('result', util.inspect(normType(initCtx, src), false, null, true));
  //   expect(normType(context, src)).toEqual(actual);
  // });
});

describe("Atom and Pair tests", () => {
  
  it("Quote literal", () => {
    const src = parsePie("'a");
    const actual = new go(new Core.The(new Core.Atom(), new Core.Quote('a')));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  it("Explicit atom type", () => {
    const src = parsePie("(the Atom 'a)");
    //const actual = new go(['the', 'Atom', "'a"]);
    const actual = new go(new Core.The(new Core.Atom(), new Core.Quote('a')));
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  // it("Atom type", () => {
  //   const src = parsePie("Atom");
  //   //const actual = new go(['the', 'U', 'Atom']);
  //   const actual = new go([new Core.The(new Core.Universe(), new Core.Atom())]);
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   const context = new Map();
  //   expect(rep(context, src)).toEqual(actual);
  // });

  // it("Pair type", () => {
  //   const src = parsePie("(Pair Atom Atom)");
  //   //const actual = new go(['the', 'U', ['Σ', [[Symbol('a'), 'Atom']], 'Atom']]);
  //   const actual = new go([new Core.The(new Core.Universe(), new Core.Sigma('a', new Core.Atom(), new Core.Atom()))]);
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   const context = new Map();
  //   expect(rep(context, src)).toEqual(actual);
  // });

  // it("Sigma type with multiple fields", () => {
  //   const src = parsePie("(Σ ((x Nat) (y Atom)) Nat)");
  //   //const actual = new go(['the', 'U', ['Σ', [[Symbol('x'), 'Nat']], ['Σ', [[Symbol('y'), 'Atom']], 'Nat']]]);
  //   const actual = new go([new Core.The(new Core.Universe(), new Core.Sigma('x', new Core.Nat(), new Core.Sigma('y', new Core.Atom(), new Core.Nat())))]);
  //   //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
  //   const context = new Map();
  //   expect(rep(context, src)).toEqual(actual);
  // });

  it("Pair construction", () => {
    const src = parsePie("(the (Pair Atom Atom) (cons 'olive 'oil))");
    //const actual = new go(['the', ['Σ', [[Symbol('x'), 'Atom']], 'Atom'], ['cons', "'olive", "'oil"]]);
    const actual = new go(new Core.The(new Core.Sigma('x', new Core.Atom(), new Core.Atom()), new Core.Cons(new Core.Quote('olive'), new Core.Quote('oil'))));
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  it("Pair first projection", () => {
    const src = parsePie("(car (the (Pair Atom Atom) (cons 'olive 'oil)))");
    //const actual = new go(['the', 'Atom', "'olive"]);
    const actual = new go(new Core.The(new Core.Atom(), new Core.Quote('olive')));
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  it("Pair second projection", () => {
    const src = parsePie("(cdr (the (Pair Atom Atom) (cons 'olive 'oil)))");
    //const actual = new go(['the', 'Atom', "'oil"]);
    const actual = new go(new Core.The(new Core.Atom(), new Core.Quote('oil')));
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
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
    const actual = new go(new Core.The(new Core.Pi('f₁', new Core.Pi('x₁', new Core.Nat(), new Core.Universe()),
                          new Core.Pi('p₁', new Core.Sigma('n', new Core.Nat(), new Core.Application(new Core.VarName('f₁'), new Core.VarName('n'))),
                          new Core.Application(new Core.VarName('f₁'), new Core.Car(new Core.VarName('p₁'))))),
                          new Core.Lambda('f₁', new Core.Lambda('p₁', new Core.Cdr(new Core.VarName('p₁'))))));
    //console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    const context = new Map();
    expect(rep(context, src)).toEqual(actual);
  });

  // it("Normalize sigma type", () => {
  //   const src = parsePie("(Σ ((x Nat) (y Nat)) Nat)");
  //   //const actual = new go(['Σ', [[Symbol('x'), 'Nat']], ['Σ', [[Symbol('y'), 'Nat']], 'Nat']]);
  //   const actual = new go(new Core.Sigma('x', new Core.Nat(), new Core.Sigma('y', new Core.Nat(), new Core.Nat())));
  //   //console.log('result', util.inspect(normType(initCtx, src), false, null, true));
  //   const context = new Map();
  //   expect(normType(context, src)).toEqual(actual);
  // });
});