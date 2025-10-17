import 'jest'
import { DefineDatatypeSource, GeneralConstructor } from '../typechecker/definedatatype'
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';
import * as S from '../types/source';
import { Context, initCtx, valInContext } from '../utils/context';
import { Renaming } from '../typechecker/utils';
import * as C from '../types/core';
import { go, SiteBinder, TypedBinder } from '../types/utils';


const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);


describe('boolean', () => {
  const define_boolean = new DefineDatatypeSource(
    testLoc,
    'Bool',
    [],
    [],
    [
      new GeneralConstructor(testLoc, 'true', [], new S.GeneralTypeConstructor(testLoc, 'Bool', [], [])),
      new GeneralConstructor(testLoc, 'false', [], new S.GeneralTypeConstructor(testLoc, 'Bool', [], []))
    ]
  )
  const ctx = initCtx
  const renaming = new Map<string, string>()
  it('test generate type and constructor', () => {
    const result = define_boolean.normalize_constructor(ctx, renaming)
    console.log(result)
  })
  const [new_ctx, new_renaming] = define_boolean.normalize_constructor(ctx, renaming)
  const Mytrue = new S.ConstructorApplication(
    testLoc,
    'true',
    []
  )
  const Myfalse = new S.ConstructorApplication(
    testLoc,
    'false',
    []
  )
  it('test type check constructors', () => {
    const result0 = Mytrue.synth(new_ctx as Context, new_renaming as Renaming)
    const result1 = Myfalse.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([result0, result1])
  })
  const eliminateTrue = new S.EliminatorApplication(
    testLoc,
    'Bool',
    Mytrue,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 't')],
      new S.Nat(testLoc)
    )
    ,[
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.Zero(testLoc)
    ]
  )

  const eliminateFalse = new S.EliminatorApplication(
    testLoc,
    'Bool',
    Myfalse,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 't')],
      new S.Nat(testLoc)
    )
    ,[
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.Zero(testLoc)
    ]
  )
  it('test eliminate true and false', () => {
    const resultTrue = eliminateTrue.synth(new_ctx as Context, new_renaming as Renaming)
    const resultFalse = eliminateFalse.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([resultTrue, resultFalse])
  })

  it('test evaluate eliminators', () => {
    const resultTrue = (eliminateTrue.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    const resultFalse = (eliminateFalse.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    // Evaluate the core expressions
    const evalTrue = valInContext(new_ctx as Context, resultTrue.expr).now()
    const evalFalse = valInContext(new_ctx as Context, resultFalse.expr).now()

    console.log([evalTrue, evalFalse])
  })

})

describe('mynat', () => {
  // define-datatype MyNat
  //   myzero : MyNat
  //   mysucc : (MyNat -> MyNat)
  const define_mynat = new DefineDatatypeSource(
    testLoc,
    'MyNat',
    [],
    [],
    [
      new GeneralConstructor(testLoc, 'myzero', [], new S.GeneralTypeConstructor(testLoc, 'MyNat', [], [])),
      new GeneralConstructor(
        testLoc,
        'mysucc',
        [new TypedBinder(new SiteBinder(testLoc, 'n'), new S.Name(testLoc, 'MyNat'))],
        new S.GeneralTypeConstructor(testLoc, 'MyNat', [], [])
      )
    ]
  )
  const ctx = initCtx
  const renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    const result = define_mynat.normalize_constructor(ctx, renaming)
    console.log(result)
  })

  const [new_ctx, new_renaming] = define_mynat.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    const Myzero = new S.ConstructorApplication(testLoc, 'myzero', [])
    const Myone = new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'myzero', [])])
    const Mytwo = new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'myzero', [])])])

    const result0 = Myzero.synth(new_ctx as Context, new_renaming as Renaming)
    const result1 = Myone.synth(new_ctx as Context, new_renaming as Renaming)
    const result2 = Mytwo.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([result0, result1, result2])
  })

  const Myzero = new S.ConstructorApplication(testLoc, 'myzero', [])
  const Myone = new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'myzero', [])])

  // Eliminator: convert MyNat to Nat
  const eliminateMyzero = new S.EliminatorApplication(
    testLoc,
    'MyNat',
    Myzero,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'n')],
      new S.Nat(testLoc)
    ),
    [
      new S.Zero(testLoc),  // myzero case: return 0
      new S.Lambda(         // mysucc case: λ(pred : MyNat) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'pred')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'ih')],
          new S.Add1(testLoc, new S.Name(testLoc, 'ih'))
        )
      )
    ]
  )

  const eliminateMyone = new S.EliminatorApplication(
    testLoc,
    'MyNat',
    Myone,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'n')],
      new S.Nat(testLoc)
    ),
    [
      new S.Zero(testLoc),  // myzero case: return 0
      new S.Lambda(         // mysucc case: λ(pred : MyNat) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'pred')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'ih')],
          new S.Add1(testLoc, new S.Name(testLoc, 'ih'))
        )
      )
    ]
  )

  it('test eliminate zero and one', () => {
    const resultZero = eliminateMyzero.synth(new_ctx as Context, new_renaming as Renaming)
    const resultOne = eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([resultZero, resultOne])
  })

  it('test evaluate eliminators', () => {
    const resultZero = (eliminateMyzero.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    const resultOne = (eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    const evalZero = valInContext(new_ctx as Context, resultZero.expr).now()
    const evalOne = valInContext(new_ctx as Context, resultOne.expr).now()

    console.log([evalZero, evalOne])
  })
})

describe('mylist', () => {
  // define-datatype MyList (E : U)
  //   mynil : (E : U) -> MyList E
  //   mycons : (E : U) -> E -> MyList E -> MyList E
  // Constructors explicitly take the type parameter E as an argument
  const define_mylist = new DefineDatatypeSource(
    testLoc,
    'MyList',
    [new TypedBinder(new SiteBinder(testLoc, 'E'), new S.Universe(testLoc))],
    [],
    [
      new GeneralConstructor(
        testLoc,
        'mynil',
        [new TypedBinder(new SiteBinder(testLoc, 'E'), new S.Universe(testLoc))],
        new S.GeneralTypeConstructor(testLoc, 'MyList', [new S.Name(testLoc, 'E')], [])
      ),
      new GeneralConstructor(
        testLoc,
        'mycons',
        [
          new TypedBinder(new SiteBinder(testLoc, 'E'), new S.Universe(testLoc)),
          new TypedBinder(new SiteBinder(testLoc, 'myhead'), new S.Name(testLoc, 'E')),
          new TypedBinder(new SiteBinder(testLoc, 'mytail'), new S.GeneralTypeConstructor(testLoc, 'MyList', [new S.Name(testLoc, 'E')], []))
        ],
        new S.GeneralTypeConstructor(testLoc, 'MyList', [new S.Name(testLoc, 'E')], [])
      )
    ]
  )
  const ctx = initCtx
  const renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    const result = define_mylist.normalize_constructor(ctx, renaming)
    console.log(result)
  })

  const [new_ctx, new_renaming] = define_mylist.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    // MyList Nat: (mynil Nat)
    const Mynil = new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
    // MyList Nat: (mycons Nat 1 (mynil Nat))
    const Myone = new S.ConstructorApplication(
      testLoc,
      'mycons',
      [
        new S.Nat(testLoc),
        new S.Add1(testLoc, new S.Zero(testLoc)),
        new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
      ]
    )

    const result0 = Mynil.synth(new_ctx as Context, new_renaming as Renaming)
    const result1 = Myone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([result0, result1])
  })

  // Construct test lists for elimination
  const Mynil = new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
  const Myone = new S.ConstructorApplication(
    testLoc,
    'mycons',
    [
      new S.Nat(testLoc),
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
    ]
  )

  // Eliminator: compute length of MyList Nat
  const eliminateMynil = new S.EliminatorApplication(
    testLoc,
    'MyList',
    Mynil,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'lst')],
      new S.Nat(testLoc)
    ),
    [
      new S.Lambda(         // mynil case: λ(E : U) → 0
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Zero(testLoc)
      ),
      new S.Lambda(         // mycons case: λ(E : U) → λ(myhead : E) → λ(mytail : MyList E) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'myhead')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'mytail')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'ih')],
              new S.Add1(testLoc, new S.Name(testLoc, 'ih'))
            )
          )
        )
      )
    ]
  )

  const eliminateMyone = new S.EliminatorApplication(
    testLoc,
    'MyList',
    Myone,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'lst')],
      new S.Nat(testLoc)
    ),
    [
      new S.Lambda(         // mynil case: λ(E : U) → 0
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Zero(testLoc)
      ),
      new S.Lambda(         // mycons case: λ(E : U) → λ(head : E) → λ(mytail : MyList E) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'head')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'mytail')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'ih')],
              new S.Add1(testLoc, new S.Name(testLoc, 'ih'))
            )
          )
        )
      )
    ]
  )

  it('test eliminate nil and cons', () => {
    const resultNil = eliminateMynil.synth(new_ctx as Context, new_renaming as Renaming)
    const resultCons = eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([resultNil, resultCons])
  })

  it('test evaluate eliminators', () => {
    const resultNil = (eliminateMynil.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    const resultCons = (eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    const evalNil = valInContext(new_ctx as Context, resultNil.expr).now()
    const evalCons = valInContext(new_ctx as Context, resultCons.expr).now()

    console.log([evalNil, evalCons])
  })
})

describe('myvec', () => {
  // define-datatype MyVec (E : U) : Nat -> U
  //   myvecnil : (E : U) -> MyVec E zero
  //   myveccons : (E : U) -> (k : Nat) -> E -> MyVec E k -> MyVec E (add1 k)
  const define_myvec = new DefineDatatypeSource(
    testLoc,
    'MyVec',
    [new TypedBinder(new SiteBinder(testLoc, 'E'), new S.Universe(testLoc))],
    [new TypedBinder(new SiteBinder(testLoc, 'len'), new S.Nat(testLoc))],
    [
      new GeneralConstructor(
        testLoc,
        'myvecnil',
        [new TypedBinder(new SiteBinder(testLoc, 'E'), new S.Universe(testLoc))],
        new S.GeneralTypeConstructor(testLoc, 'MyVec', [new S.Name(testLoc, 'E')], [new S.Zero(testLoc)])
      ),
      new GeneralConstructor(
        testLoc,
        'myveccons',
        [
          new TypedBinder(new SiteBinder(testLoc, 'E'), new S.Universe(testLoc)),
          new TypedBinder(new SiteBinder(testLoc, 'k'), new S.Nat(testLoc)),
          new TypedBinder(new SiteBinder(testLoc, 'head'), new S.Name(testLoc, 'E')),
          new TypedBinder(new SiteBinder(testLoc, 'mytail'), new S.GeneralTypeConstructor(testLoc, 'MyVec', [new S.Name(testLoc, 'E')], [new S.Name(testLoc, 'k')]))
        ],
        new S.GeneralTypeConstructor(testLoc, 'MyVec', [new S.Name(testLoc, 'E')], [new S.Add1(testLoc, new S.Name(testLoc, 'k'))])
      )
    ]
  )
  const ctx = initCtx
  const renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    const result = define_myvec.normalize_constructor(ctx, renaming)
    console.log(result)
  })

  const [new_ctx, new_renaming] = define_myvec.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    // MyVec Nat 0: (myvecnil Nat)
    const Myvecnil = new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
    // MyVec Nat 1: (myveccons Nat 0 1 (myvecnil Nat))
    const Myvecone = new S.ConstructorApplication(
      testLoc,
      'myveccons',
      [
        new S.Nat(testLoc),
        new S.Zero(testLoc),
        new S.Add1(testLoc, new S.Zero(testLoc)),
        new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
      ]
    )
    // MyVec Nat 2: (myveccons Nat 1 2 (myveccons Nat 0 1 (myvecnil Nat)))
    const Myvectwo = new S.ConstructorApplication(
      testLoc,
      'myveccons',
      [
        new S.Nat(testLoc),
        new S.Add1(testLoc, new S.Zero(testLoc)),
        new S.Add1(testLoc, new S.Add1(testLoc, new S.Zero(testLoc))),
        new S.ConstructorApplication(
          testLoc,
          'myveccons',
          [
            new S.Nat(testLoc),
            new S.Zero(testLoc),
            new S.Add1(testLoc, new S.Zero(testLoc)),
            new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
          ]
        )
      ]
    )

    const result0 = Myvecnil.synth(new_ctx as Context, new_renaming as Renaming)
    const result1 = Myvecone.synth(new_ctx as Context, new_renaming as Renaming)
    const result2 = Myvectwo.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([result0, result1, result2])
  })

  // Construct test vectors for elimination
  const Myvecnil = new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
  const Myvecone = new S.ConstructorApplication(
    testLoc,
    'myveccons',
    [
      new S.Nat(testLoc),
      new S.Zero(testLoc),
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
    ]
  )

  // Eliminator: sum all elements of MyVec Nat k
  const eliminateMyvecnil = new S.EliminatorApplication(
    testLoc,
    'MyVec',
    Myvecnil,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'len'), new SiteBinder(testLoc, 'vec')],
      new S.Nat(testLoc)
    ),
    [
      new S.Lambda(         // myvecnil case: λ(E : U) → 0
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Zero(testLoc)
      ),
      new S.Lambda(         // myveccons case: λ(E : U) → λ(k : Nat) → λ(head : E) → λ(mytail : MyVec E k) → λ(ih : Nat) → (+ head ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'k')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'head')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'mytail')],
              new S.Lambda(
                testLoc,
                [new SiteBinder(testLoc, 'ih')],
                new S.IterNat(
                  testLoc,
                  new S.Name(testLoc, 'head'),
                  new S.Name(testLoc, 'ih'),
                  new S.Lambda(
                    testLoc,
                    [new SiteBinder(testLoc, 'n')],
                    new S.Add1(testLoc, new S.Name(testLoc, 'n'))
                  )
                )
              )
            )
          )
        )
      )
    ]
  )

  const eliminateMyvecone = new S.EliminatorApplication(
    testLoc,
    'MyVec',
    Myvecone,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'len'), new SiteBinder(testLoc, 'vec')],
      new S.Nat(testLoc)
    ),
    [
      new S.Lambda(         // myvecnil case: λ(E : U) → 0
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Zero(testLoc)
      ),
      new S.Lambda(         // myveccons case: λ(E : U) → λ(k : Nat) → λ(head : E) → λ(mytail : MyVec E k) → λ(ih : Nat) → (+ head ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'k')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'myhead')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'mytail')],
              new S.Lambda(
                testLoc,
                [new SiteBinder(testLoc, 'ih')],
                new S.IterNat(
                  testLoc,
                  new S.Name(testLoc, 'myhead'),
                  new S.Name(testLoc, 'ih'),
                  new S.Lambda(
                    testLoc,
                    [new SiteBinder(testLoc, 'n')],
                    new S.Add1(testLoc, new S.Name(testLoc, 'n'))
                  )
                )
              )
            )
          )
        )
      )
    ]
  )

  it('test eliminate myvecnil and myveccons', () => {
    const resultNil = eliminateMyvecnil.synth(new_ctx as Context, new_renaming as Renaming)
    const resultOne = eliminateMyvecone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([resultNil, resultOne])
  })

  it('test evaluate eliminators', () => {
    const resultNil = (eliminateMyvecnil.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    const resultOne = (eliminateMyvecone.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    const evalNil = valInContext(new_ctx as Context, resultNil.expr).now()
    const evalOne = valInContext(new_ctx as Context, resultOne.expr).now()

    console.log([evalNil, evalOne])
  })
})

describe('less-than', () => {
  // define-datatype Less-Than () ((j Nat) (k Nat))
  //   zero-smallest : (n : Nat) -> Less-Than zero (add1 n)
  //   add1-smaller : (j : Nat) -> (k : Nat) -> Less-Than j k -> Less-Than (add1 j) (add1 k)
  const define_less_than = new DefineDatatypeSource(
    testLoc,
    'Less-Than',
    [],  // No parameters
    [
      new TypedBinder(new SiteBinder(testLoc, 'j'), new S.Nat(testLoc)),
      new TypedBinder(new SiteBinder(testLoc, 'k'), new S.Nat(testLoc))
    ],  // Two indices: j and k
    [
      new GeneralConstructor(
        testLoc,
        'zero-smallest',
        [new TypedBinder(new SiteBinder(testLoc, 'n'), new S.Nat(testLoc))],
        new S.GeneralTypeConstructor(
          testLoc,
          'Less-Than',
          [],
          [new S.Zero(testLoc), new S.Add1(testLoc, new S.Name(testLoc, 'n'))]
        )
      ),
      new GeneralConstructor(
        testLoc,
        'add1-smaller',
        [
          new TypedBinder(new SiteBinder(testLoc, 'j'), new S.Nat(testLoc)),
          new TypedBinder(new SiteBinder(testLoc, 'k'), new S.Nat(testLoc)),
          new TypedBinder(
            new SiteBinder(testLoc, 'j<k'),
            new S.GeneralTypeConstructor(testLoc, 'Less-Than', [], [new S.Name(testLoc, 'j'), new S.Name(testLoc, 'k')])
          )
        ],
        new S.GeneralTypeConstructor(
          testLoc,
          'Less-Than',
          [],
          [new S.Add1(testLoc, new S.Name(testLoc, 'j')), new S.Add1(testLoc, new S.Name(testLoc, 'k'))]
        )
      )
    ]
  )
  const ctx = initCtx
  const renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    const result = define_less_than.normalize_constructor(ctx, renaming)
    console.log(result)
  })

  const [new_ctx, new_renaming] = define_less_than.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    // Proof of 0 < 1: (zero-smallest 0)
    const proof_0_lt_1 = new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])

    // Proof of 0 < 2: (zero-smallest 1)
    const proof_0_lt_2 = new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Add1(testLoc, new S.Zero(testLoc))])

    // Proof of 1 < 2: (add1-smaller 0 1 (zero-smallest 0))
    const proof_1_lt_2 = new S.ConstructorApplication(
      testLoc,
      'add1-smaller',
      [
        new S.Zero(testLoc),
        new S.Add1(testLoc, new S.Zero(testLoc)),
        new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])
      ]
    )

    // Proof of 1 < 3: (add1-smaller 0 2 (zero-smallest 1))
    const proof_1_lt_3 = new S.ConstructorApplication(
      testLoc,
      'add1-smaller',
      [
        new S.Zero(testLoc),
        new S.Add1(testLoc, new S.Add1(testLoc, new S.Zero(testLoc))),
        new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Add1(testLoc, new S.Zero(testLoc))])
      ]
    )

    const result0 = proof_0_lt_1.synth(new_ctx as Context, new_renaming as Renaming)
    const result1 = proof_0_lt_2.synth(new_ctx as Context, new_renaming as Renaming)
    const result2 = proof_1_lt_2.synth(new_ctx as Context, new_renaming as Renaming)
    const result3 = proof_1_lt_3.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([result0, result1, result2, result3])
  })

  // Test eliminator: extract the smaller number (j)
  const proof_0_lt_1 = new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])
  const proof_1_lt_2 = new S.ConstructorApplication(
    testLoc,
    'add1-smaller',
    [
      new S.Zero(testLoc),
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])
    ]
  )

  // Eliminator: return the smaller number (first index j)
  const eliminate_0_lt_1 = new S.EliminatorApplication(
    testLoc,
    'Less-Than',
    proof_0_lt_1,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'j'), new SiteBinder(testLoc, 'k'), new SiteBinder(testLoc, 'proof')],
      new S.Nat(testLoc)
    ),
    [
      new S.Lambda(         // zero-smallest case: λ(n : Nat) → 0
        testLoc,
        [new SiteBinder(testLoc, 'n')],
        new S.Zero(testLoc)
      ),
      new S.Lambda(         // add1-smaller case: λ(j : Nat) → λ(k : Nat) → λ(j<k : Less-Than j k) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'j')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'k')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'j<k')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'ih')],
              new S.Add1(testLoc, new S.Name(testLoc, 'ih'))
            )
          )
        )
      )
    ]
  )

  const eliminate_1_lt_2 = new S.EliminatorApplication(
    testLoc,
    'Less-Than',
    proof_1_lt_2,
    new S.Lambda(
      testLoc,
      [new SiteBinder(testLoc, 'j'), new SiteBinder(testLoc, 'k'), new SiteBinder(testLoc, 'proof')],
      new S.Nat(testLoc)
    ),
    [
      new S.Lambda(         // zero-smallest case: λ(n : Nat) → 0
        testLoc,
        [new SiteBinder(testLoc, 'n')],
        new S.Zero(testLoc)
      ),
      new S.Lambda(         // add1-smaller case: λ(j : Nat) → λ(k : Nat) → λ(j<k : Less-Than j k) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'j')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'k')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'j<k')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'ih')],
              new S.Add1(testLoc, new S.Name(testLoc, 'ih'))
            )
          )
        )
      )
    ]
  )

  it('test eliminate less-than proofs', () => {
    const result0 = eliminate_0_lt_1.synth(new_ctx as Context, new_renaming as Renaming)
    const result1 = eliminate_1_lt_2.synth(new_ctx as Context, new_renaming as Renaming)
    console.log([result0, result1])
  })

  it('test evaluate eliminators', () => {
    const result0 = (eliminate_0_lt_1.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    const result1 = (eliminate_1_lt_2.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    const eval0 = valInContext(new_ctx as Context, result0.expr).now()
    const eval1 = valInContext(new_ctx as Context, result1.expr).now()

    console.log([eval0, eval1])
  })
})
