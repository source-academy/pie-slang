import 'jest'
import { DefineDatatypeSource, GeneralConstructor } from '../typechecker/definedatatype'
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';
import * as S from '../types/source';
import { Context, initCtx, valInContext } from '../utils/context';
import { inspect } from 'util';
import { Renaming } from '../typechecker/utils';
import * as C from '../types/core';
import { go, SiteBinder, TypedBinder } from '../types/utils';


const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);


describe('boolean', () => {
  let define_boolean = new DefineDatatypeSource(
    testLoc,
    'Bool',
    [],
    [],
    [
      new GeneralConstructor(testLoc, 'true', [], new S.GeneralTypeConstructor(testLoc, 'Bool', [], [])),
      new GeneralConstructor(testLoc, 'false', [], new S.GeneralTypeConstructor(testLoc, 'Bool', [], []))
    ]
  )
  let ctx = initCtx
  let renameing = new Map<string, string>()
  it('test generate type and constructor', () => {
    let result = define_boolean.normalize_constructor(ctx, renameing)
    console.log(inspect(result, true, null, true))
  })
  let [new_ctx, new_renaming] = define_boolean.normalize_constructor(ctx, renameing)
  let Mytrue = new S.ConstructorApplication(
    testLoc,
    'true',
    []
  )
  let Myfalse = new S.ConstructorApplication(
    testLoc,
    'false',
    []
  )
  it('test type check constructors', () => {
    let result0 = Mytrue.synth(new_ctx as Context, new_renaming as Renaming)
    let result1 = Myfalse.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([result0, result1], true, null, true))
  })
  let result0 = (Mytrue.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
  let result1 = (Myfalse.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
  let eliminateTrue = new S.EliminatorApplication(
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

  let eliminateFalse = new S.EliminatorApplication(
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
    let resultTrue = eliminateTrue.synth(new_ctx as Context, new_renaming as Renaming)
    let resultFalse = eliminateFalse.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([resultTrue, resultFalse], true, null, true))
  })

  it('test evaluate eliminators', () => {
    let resultTrue = (eliminateTrue.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    let resultFalse = (eliminateFalse.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    // Evaluate the core expressions
    let evalTrue = valInContext(new_ctx as Context, resultTrue.expr).now()
    let evalFalse = valInContext(new_ctx as Context, resultFalse.expr).now()

    console.log(inspect([evalTrue, evalFalse], true, null, true))
  })

})

describe('mynat', () => {
  // define-datatype MyNat
  //   myzero : MyNat
  //   mysucc : (MyNat -> MyNat)
  let define_mynat = new DefineDatatypeSource(
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
  let ctx = initCtx
  let renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    let result = define_mynat.normalize_constructor(ctx, renaming)
    console.log(inspect(result, true, null, true))
  })

  let [new_ctx, new_renaming] = define_mynat.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    let Myzero = new S.ConstructorApplication(testLoc, 'myzero', [])
    let Myone = new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'myzero', [])])
    let Mytwo = new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'myzero', [])])])

    let result0 = Myzero.synth(new_ctx as Context, new_renaming as Renaming)
    let result1 = Myone.synth(new_ctx as Context, new_renaming as Renaming)
    let result2 = Mytwo.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([result0, result1, result2], true, null, true))
  })

  let Myzero = new S.ConstructorApplication(testLoc, 'myzero', [])
  let Myone = new S.ConstructorApplication(testLoc, 'mysucc', [new S.ConstructorApplication(testLoc, 'myzero', [])])

  // Eliminator: convert MyNat to Nat
  let eliminateMyzero = new S.EliminatorApplication(
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

  let eliminateMyone = new S.EliminatorApplication(
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
    let resultZero = eliminateMyzero.synth(new_ctx as Context, new_renaming as Renaming)
    let resultOne = eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([resultZero, resultOne], true, null, true))
  })

  it('test evaluate eliminators', () => {
    let resultZero = (eliminateMyzero.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    let resultOne = (eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    let evalZero = valInContext(new_ctx as Context, resultZero.expr).now()
    let evalOne = valInContext(new_ctx as Context, resultOne.expr).now()

    console.log(inspect([evalZero, evalOne], true, null, true))
  })
})

describe('mylist', () => {
  // define-datatype MyList (E : U)
  //   mynil : (E : U) -> MyList E
  //   mycons : (E : U) -> E -> MyList E -> MyList E
  // Constructors explicitly take the type parameter E as an argument
  let define_mylist = new DefineDatatypeSource(
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
          new TypedBinder(new SiteBinder(testLoc, 'head'), new S.Name(testLoc, 'E')),
          new TypedBinder(new SiteBinder(testLoc, 'tail'), new S.GeneralTypeConstructor(testLoc, 'MyList', [new S.Name(testLoc, 'E')], []))
        ],
        new S.GeneralTypeConstructor(testLoc, 'MyList', [new S.Name(testLoc, 'E')], [])
      )
    ]
  )
  let ctx = initCtx
  let renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    let result = define_mylist.normalize_constructor(ctx, renaming)
    console.log(inspect(result, true, null, true))
  })

  let [new_ctx, new_renaming] = define_mylist.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    // MyList Nat: (mynil Nat)
    let Mynil = new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
    // MyList Nat: (mycons Nat 1 (mynil Nat))
    let Myone = new S.ConstructorApplication(
      testLoc,
      'mycons',
      [
        new S.Nat(testLoc),
        new S.Add1(testLoc, new S.Zero(testLoc)),
        new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
      ]
    )

    let result0 = Mynil.synth(new_ctx as Context, new_renaming as Renaming)
    let result1 = Myone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([result0, result1], true, null, true))
  })

  // Construct test lists for elimination
  let Mynil = new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
  let Myone = new S.ConstructorApplication(
    testLoc,
    'mycons',
    [
      new S.Nat(testLoc),
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.ConstructorApplication(testLoc, 'mynil', [new S.Nat(testLoc)])
    ]
  )

  // Eliminator: compute length of MyList Nat
  let eliminateMynil = new S.EliminatorApplication(
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
      new S.Lambda(         // mycons case: λ(E : U) → λ(head : E) → λ(tail : MyList E) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'head')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'tail')],
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

  let eliminateMyone = new S.EliminatorApplication(
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
      new S.Lambda(         // mycons case: λ(E : U) → λ(head : E) → λ(tail : MyList E) → λ(ih : Nat) → (add1 ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'head')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'tail')],
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
    let resultNil = eliminateMynil.synth(new_ctx as Context, new_renaming as Renaming)
    let resultCons = eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([resultNil, resultCons], true, null, true))
  })

  it('test evaluate eliminators', () => {
    let resultNil = (eliminateMynil.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    let resultCons = (eliminateMyone.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    let evalNil = valInContext(new_ctx as Context, resultNil.expr).now()
    let evalCons = valInContext(new_ctx as Context, resultCons.expr).now()

    console.log(inspect([evalNil, evalCons], true, null, true))
  })
})

describe('myvec', () => {
  // define-datatype MyVec (E : U) : Nat -> U
  //   myvecnil : (E : U) -> MyVec E zero
  //   myveccons : (E : U) -> (k : Nat) -> E -> MyVec E k -> MyVec E (add1 k)
  let define_myvec = new DefineDatatypeSource(
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
          new TypedBinder(new SiteBinder(testLoc, 'tail'), new S.GeneralTypeConstructor(testLoc, 'MyVec', [new S.Name(testLoc, 'E')], [new S.Name(testLoc, 'k')]))
        ],
        new S.GeneralTypeConstructor(testLoc, 'MyVec', [new S.Name(testLoc, 'E')], [new S.Add1(testLoc, new S.Name(testLoc, 'k'))])
      )
    ]
  )
  let ctx = initCtx
  let renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    let result = define_myvec.normalize_constructor(ctx, renaming)
    console.log(inspect(result, true, null, true))
  })

  let [new_ctx, new_renaming] = define_myvec.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    // MyVec Nat 0: (myvecnil Nat)
    let Myvecnil = new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
    // MyVec Nat 1: (myveccons Nat 0 1 (myvecnil Nat))
    let Myvecone = new S.ConstructorApplication(
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
    let Myvectwo = new S.ConstructorApplication(
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

    let result0 = Myvecnil.synth(new_ctx as Context, new_renaming as Renaming)
    let result1 = Myvecone.synth(new_ctx as Context, new_renaming as Renaming)
    let result2 = Myvectwo.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([result0, result1, result2], true, null, true))
  })

  // Construct test vectors for elimination
  let Myvecnil = new S.ConstructorApplication(testLoc, 'myvecnil', [new S.Nat(testLoc)])
  let Myvecone = new S.ConstructorApplication(
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
  let eliminateMyvecnil = new S.EliminatorApplication(
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
      new S.Lambda(         // myveccons case: λ(E : U) → λ(k : Nat) → λ(e : E) → λ(es : MyVec E k) → λ(ih : Nat) → (+ e ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'k')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'e')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'es')],
              new S.Lambda(
                testLoc,
                [new SiteBinder(testLoc, 'ih')],
                new S.IterNat(
                  testLoc,
                  new S.Name(testLoc, 'e'),
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

  let eliminateMyvecone = new S.EliminatorApplication(
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
      new S.Lambda(         // myveccons case: λ(E : U) → λ(k : Nat) → λ(e : E) → λ(es : MyVec E k) → λ(ih : Nat) → (+ e ih)
        testLoc,
        [new SiteBinder(testLoc, 'E')],
        new S.Lambda(
          testLoc,
          [new SiteBinder(testLoc, 'k')],
          new S.Lambda(
            testLoc,
            [new SiteBinder(testLoc, 'e')],
            new S.Lambda(
              testLoc,
              [new SiteBinder(testLoc, 'es')],
              new S.Lambda(
                testLoc,
                [new SiteBinder(testLoc, 'ih')],
                new S.IterNat(
                  testLoc,
                  new S.Name(testLoc, 'e'),
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
    let resultNil = eliminateMyvecnil.synth(new_ctx as Context, new_renaming as Renaming)
    let resultOne = eliminateMyvecone.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([resultNil, resultOne], true, null, true))
  })

  it('test evaluate eliminators', () => {
    let resultNil = (eliminateMyvecnil.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    let resultOne = (eliminateMyvecone.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    let evalNil = valInContext(new_ctx as Context, resultNil.expr).now()
    let evalOne = valInContext(new_ctx as Context, resultOne.expr).now()

    console.log(inspect([evalNil, evalOne], true, null, true))
  })
})

describe('less-than', () => {
  // define-datatype Less-Than () ((j Nat) (k Nat))
  //   zero-smallest : (n : Nat) -> Less-Than zero (add1 n)
  //   add1-smaller : (j : Nat) -> (k : Nat) -> Less-Than j k -> Less-Than (add1 j) (add1 k)
  let define_less_than = new DefineDatatypeSource(
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
  let ctx = initCtx
  let renaming = new Map<string, string>()

  it('test generate type and constructors', () => {
    let result = define_less_than.normalize_constructor(ctx, renaming)
    console.log(inspect(result, true, null, true))
  })

  let [new_ctx, new_renaming] = define_less_than.normalize_constructor(ctx, renaming)

  it('test type check constructors', () => {
    // Proof of 0 < 1: (zero-smallest 0)
    let proof_0_lt_1 = new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])

    // Proof of 0 < 2: (zero-smallest 1)
    let proof_0_lt_2 = new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Add1(testLoc, new S.Zero(testLoc))])

    // Proof of 1 < 2: (add1-smaller 0 1 (zero-smallest 0))
    let proof_1_lt_2 = new S.ConstructorApplication(
      testLoc,
      'add1-smaller',
      [
        new S.Zero(testLoc),
        new S.Add1(testLoc, new S.Zero(testLoc)),
        new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])
      ]
    )

    // Proof of 1 < 3: (add1-smaller 0 2 (zero-smallest 1))
    let proof_1_lt_3 = new S.ConstructorApplication(
      testLoc,
      'add1-smaller',
      [
        new S.Zero(testLoc),
        new S.Add1(testLoc, new S.Add1(testLoc, new S.Zero(testLoc))),
        new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Add1(testLoc, new S.Zero(testLoc))])
      ]
    )

    let result0 = proof_0_lt_1.synth(new_ctx as Context, new_renaming as Renaming)
    let result1 = proof_0_lt_2.synth(new_ctx as Context, new_renaming as Renaming)
    let result2 = proof_1_lt_2.synth(new_ctx as Context, new_renaming as Renaming)
    let result3 = proof_1_lt_3.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([result0, result1, result2, result3], true, null, true))
  })

  // Test eliminator: extract the smaller number (j)
  let proof_0_lt_1 = new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])
  let proof_1_lt_2 = new S.ConstructorApplication(
    testLoc,
    'add1-smaller',
    [
      new S.Zero(testLoc),
      new S.Add1(testLoc, new S.Zero(testLoc)),
      new S.ConstructorApplication(testLoc, 'zero-smallest', [new S.Zero(testLoc)])
    ]
  )

  // Eliminator: return the smaller number (first index j)
  let eliminate_0_lt_1 = new S.EliminatorApplication(
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

  let eliminate_1_lt_2 = new S.EliminatorApplication(
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
    let result0 = eliminate_0_lt_1.synth(new_ctx as Context, new_renaming as Renaming)
    let result1 = eliminate_1_lt_2.synth(new_ctx as Context, new_renaming as Renaming)
    console.log(inspect([result0, result1], true, null, true))
  })

  it('test evaluate eliminators', () => {
    let result0 = (eliminate_0_lt_1.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result
    let result1 = (eliminate_1_lt_2.synth(new_ctx as Context, new_renaming as Renaming) as go<C.The>).result

    let eval0 = valInContext(new_ctx as Context, result0.expr).now()
    let eval1 = valInContext(new_ctx as Context, result1.expr).now()

    console.log(inspect([eval0, eval1], true, null, true))
  })
})


