import 'jest';
import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';
import { DefineDatatypeSource, GeneralConstructor } from '../typechecker/definedatatype';
import { Context, bindFree } from '../utils/context';
import { TypedBinder, SiteBinder, fresh } from '../types/utils';
import { inspect } from 'util';

// Test location
const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);

describe("normalize_constructor tests", () => {
  it("should normalize constructors for Bool datatype", () => {
    const ctx: Context = new Map();

    // Create Bool datatype with two simple constructors
    // For simple types with no parameters/indices, the "indices" is just Universe
    // (the type signature says S.Pi but it's used as the body of a Pi)
    const indicesBody = new S.Universe(testLoc) as any;

    const boolDatatype = new DefineDatatypeSource(
      testLoc,
      "Bool",
      [], // no parameters
      indicesBody, // indices body: U
      [
        new GeneralConstructor(
          testLoc,
          "true",
          [], // no args
          new S.GeneralTypeConstructor(testLoc, "Bool", [], [])
        ),
        new GeneralConstructor(
          testLoc,
          "false",
          [], // no args
          new S.GeneralTypeConstructor(testLoc, "Bool", [], [])
        )
      ]
    );

    // Call normalize_constructor
    const normalizedConstructors = boolDatatype.normalize_constructor(ctx, new Map());
    console.log(inspect(normalizedConstructors, true, null, true))

    // Verify we got 2 normalized constructors
    expect(normalizedConstructors).toHaveLength(2);

    // Check first constructor (true)
    const trueConstructor = normalizedConstructors[0];
    expect(trueConstructor).toBeInstanceOf(C.ConstructorType);
    expect(trueConstructor.name).toBe("true");
    expect(trueConstructor.index).toBe(0);
    expect(trueConstructor.type).toBe("Bool");
    expect(trueConstructor.argTypes).toHaveLength(0); // no arguments
    expect(trueConstructor.rec_argTypes).toHaveLength(0); // no recursive arguments

    // Check second constructor (false)
    const falseConstructor = normalizedConstructors[1];
    expect(falseConstructor).toBeInstanceOf(C.ConstructorType);
    expect(falseConstructor.name).toBe("false");
    expect(falseConstructor.index).toBe(1);
    expect(falseConstructor.type).toBe("Bool");
    expect(falseConstructor.argTypes).toHaveLength(0);
    expect(falseConstructor.rec_argTypes).toHaveLength(0);

    console.log("✅ Bool constructors normalized successfully!");
  });

  it("should normalize constructors with arguments for Nat-like datatype", () => {
    const ctx: Context = new Map();

    // Create MyNat datatype with constructors that have arguments
    const indicesBody = new S.Universe(testLoc) as any;

    const myNatDatatype = new DefineDatatypeSource(
      testLoc,
      "MyNat",
      [], // no parameters
      indicesBody, // indices body: U
      [
        new GeneralConstructor(
          testLoc,
          "myZero",
          [], // no args
          new S.GeneralTypeConstructor(testLoc, "MyNat", [], [])
        ),
        new GeneralConstructor(
          testLoc,
          "mySucc",
          [
            new TypedBinder(
              new SiteBinder(testLoc, "pred"),
              new S.GeneralTypeConstructor(testLoc, "MyNat", [], [])
            )
          ],
          new S.GeneralTypeConstructor(testLoc, "MyNat", [], [])
        )
      ]
    );

    // Call normalize_constructor
    const normalizedConstructors = myNatDatatype.normalize_constructor(ctx, new Map());
    console.log(inspect(normalizedConstructors, true, null, true))


    // Verify we got 2 normalized constructors
    expect(normalizedConstructors).toHaveLength(2);

    // Check myZero constructor
    const zeroConstructor = normalizedConstructors[0];
    expect(zeroConstructor.name).toBe("myZero");
    expect(zeroConstructor.index).toBe(0);
    expect(zeroConstructor.argTypes).toHaveLength(0);
    expect(zeroConstructor.rec_argTypes).toHaveLength(0);

    // Check mySucc constructor - should have one recursive argument
    const succConstructor = normalizedConstructors[1];
    expect(succConstructor.name).toBe("mySucc");
    expect(succConstructor.index).toBe(1);
    expect(succConstructor.type).toBe("MyNat");
    // The recursive argument should be detected
    expect(succConstructor.rec_argTypes).toHaveLength(1);
    expect(succConstructor.argTypes).toHaveLength(0); // non-recursive args

    console.log("✅ MyNat constructors with recursive arguments normalized successfully!");
  });

  it("should normalize constructors with both recursive and non-recursive arguments", () => {
    const ctx: Context = new Map();

    // Create a Pair-like datatype that mixes recursive and non-recursive arguments
    const indicesBody = new S.Universe(testLoc) as any;

    const pairDatatype = new DefineDatatypeSource(
      testLoc,
      "MyList",
      [], // no parameters
      indicesBody,
      [
        new GeneralConstructor(
          testLoc,
          "nil",
          [],
          new S.GeneralTypeConstructor(testLoc, "MyList", [], [])
        ),
        new GeneralConstructor(
          testLoc,
          "cons",
          [
            new TypedBinder(
              new SiteBinder(testLoc, "head"),
              new S.Nat(testLoc) // non-recursive: Nat
            ),
            new TypedBinder(
              new SiteBinder(testLoc, "tail"),
              new S.GeneralTypeConstructor(testLoc, "MyList", [], []) // recursive
            )
          ],
          new S.GeneralTypeConstructor(testLoc, "MyList", [], [])
        )
      ]
    );

    const normalizedConstructors = pairDatatype.normalize_constructor(ctx, new Map());

    console.log(inspect(normalizedConstructors, true, null, true))


    expect(normalizedConstructors).toHaveLength(2);

    // Check cons constructor
    const consConstructor = normalizedConstructors[1];
    expect(consConstructor.name).toBe("cons");
    expect(consConstructor.index).toBe(1);

    // Should have 1 non-recursive arg (head: Nat) and 1 recursive arg (tail: MyList)
    expect(consConstructor.argTypes).toHaveLength(1); // head (Nat)
    expect(consConstructor.rec_argTypes).toHaveLength(1); // tail (MyList)

    // Verify the non-recursive argument is Nat
    expect(consConstructor.argTypes[0]).toBeInstanceOf(C.Nat);

    console.log("✅ MyList constructors with mixed argument types normalized successfully!");
  });

  it("should throw error for invalid constructor types", () => {
    const ctx: Context = new Map();

    // Create a datatype with an invalid constructor return type
    const indicesBody = new S.Universe(testLoc) as any;

    const invalidDatatype = new DefineDatatypeSource(
      testLoc,
      "Invalid",
      [],
      indicesBody,
      [
        new GeneralConstructor(
          testLoc,
          "bad",
          [
            new TypedBinder(
              new SiteBinder(testLoc, "x"),
              new S.Name(testLoc, "UndefinedType") // This type doesn't exist
            )
          ],
          new S.GeneralTypeConstructor(testLoc, "Invalid", [], [])
        )
      ]
    );

    // Should throw an error during normalization
    expect(() => {
      invalidDatatype.normalize_constructor(ctx, new Map());
    }).toThrow();

    console.log("✅ Invalid constructor properly throws error!");
  });

  it("should normalize constructors for List with generic type parameter", () => {
    const ctx: Context = new Map();

    // Create List datatype with generic type parameter E : U
    // List has type: (E : U) -> U
    const indicesBody = new S.Universe(testLoc) as any;

    const listDatatype = new DefineDatatypeSource(
      testLoc,
      "List",
      [
        new TypedBinder(
          new SiteBinder(testLoc, "E"),
          new S.Universe(testLoc)
        )
      ], // parameter E : U
      indicesBody,
      [
        new GeneralConstructor(
          testLoc,
          "nil",
          [], // no args
          new S.GeneralTypeConstructor(testLoc, "List", [new S.Name(testLoc, "E")], [])
        ),
        new GeneralConstructor(
          testLoc,
          "cons",
          [
            new TypedBinder(
              new SiteBinder(testLoc, "head"),
              new S.Name(testLoc, "E") // head : E
            ),
            new TypedBinder(
              new SiteBinder(testLoc, "tail"),
              new S.GeneralTypeConstructor(testLoc, "List", [new S.Name(testLoc, "E")], []) // tail : List E
            )
          ],
          new S.GeneralTypeConstructor(testLoc, "List", [new S.Name(testLoc, "E")], [])
        )
      ]
    );

    const normalizedConstructors = listDatatype.normalize_constructor(ctx, new Map());
    console.log(inspect(normalizedConstructors, true, null, true))

    expect(normalizedConstructors).toHaveLength(2);

    // Check nil constructor
    const nilConstructor = normalizedConstructors[0];
    expect(nilConstructor.name).toBe("nil");
    expect(nilConstructor.index).toBe(0);
    expect(nilConstructor.type).toBe("List");
    expect(nilConstructor.argTypes).toHaveLength(0);
    expect(nilConstructor.rec_argTypes).toHaveLength(0);

    // Check cons constructor
    const consConstructor = normalizedConstructors[1];
    expect(consConstructor.name).toBe("cons");
    expect(consConstructor.index).toBe(1);
    expect(consConstructor.type).toBe("List");

    // cons should have 1 non-recursive arg (head : E) and 1 recursive arg (tail : List E)
    expect(consConstructor.argTypes).toHaveLength(1); // head
    expect(consConstructor.rec_argTypes).toHaveLength(1); // tail

    console.log("✅ List with generic type parameter normalized successfully!");
  });

  it("should normalize constructors for Vec with generic type parameter and index", () => {
    const ctx: Context = new Map();

    // Create Vec datatype with generic type parameter E : U and index n : Nat
    // Vec has type: (E : U) -> (n : Nat) -> U
    const indicesBody = new S.Pi(
      testLoc,
      [
        new TypedBinder(
          new SiteBinder(testLoc, "n"),
          new S.Nat(testLoc)
        )
      ],
      new S.Universe(testLoc)
    );

    const vecDatatype = new DefineDatatypeSource(
      testLoc,
      "Vec",
      [
        new TypedBinder(
          new SiteBinder(testLoc, "E"),
          new S.Universe(testLoc)
        )
      ], // parameter E : U
      indicesBody, // index n : Nat
      [
        new GeneralConstructor(
          testLoc,
          "vecnil",
          [], // no args
          new S.GeneralTypeConstructor(
            testLoc,
            "Vec",
            [new S.Name(testLoc, "E")],
            [new S.Zero(testLoc)] // Vec E zero
          )
        ),
        new GeneralConstructor(
          testLoc,
          "veccons",
          [
            new TypedBinder(
              new SiteBinder(testLoc, "k"),
              new S.Nat(testLoc) // k : Nat
            ),
            new TypedBinder(
              new SiteBinder(testLoc, "head"),
              new S.Name(testLoc, "E") // head : E
            ),
            new TypedBinder(
              new SiteBinder(testLoc, "tail"),
              new S.GeneralTypeConstructor(
                testLoc,
                "Vec",
                [new S.Name(testLoc, "E")],
                [new S.Name(testLoc, "k")] // tail : Vec E k
              )
            )
          ],
          new S.GeneralTypeConstructor(
            testLoc,
            "Vec",
            [new S.Name(testLoc, "E")],
            [new S.Add1(testLoc, new S.Name(testLoc, "k"))] // Vec E (add1 k)
          )
        )
      ]
    );

    const normalizedConstructors = vecDatatype.normalize_constructor(ctx, new Map());
    console.log(inspect(normalizedConstructors, true, null, true))

    expect(normalizedConstructors).toHaveLength(2);

    // Check vecnil constructor
    const vecnilConstructor = normalizedConstructors[0];
    expect(vecnilConstructor.name).toBe("vecnil");
    expect(vecnilConstructor.index).toBe(0);
    expect(vecnilConstructor.type).toBe("Vec");
    expect(vecnilConstructor.argTypes).toHaveLength(0);
    expect(vecnilConstructor.rec_argTypes).toHaveLength(0);

    // Check veccons constructor
    const vecconsConstructor = normalizedConstructors[1];
    expect(vecconsConstructor.name).toBe("veccons");
    expect(vecconsConstructor.index).toBe(1);
    expect(vecconsConstructor.type).toBe("Vec");

    // veccons should have 2 non-recursive args (k : Nat, head : E) and 1 recursive arg (tail : Vec E k)
    expect(vecconsConstructor.argTypes).toHaveLength(2); // k and head
    expect(vecconsConstructor.rec_argTypes).toHaveLength(1); // tail

    // Verify the types of non-recursive arguments
    expect(vecconsConstructor.argTypes[0]).toBeInstanceOf(C.Nat); // k : Nat
    // head : E would be a Free variable reference

    console.log("✅ Vec with generic type parameter and index normalized successfully!");
  });
});
