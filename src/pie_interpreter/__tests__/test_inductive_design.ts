import 'jest';
import * as S from '../types/source';
import { TypedBinder, SiteBinder } from '../types/utils';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';

// Test location
const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);

describe("Inductive Types Design Test", () => {
  
  it("should demonstrate ConstructorType vs Constructor distinction", () => {
    
    // ============================================
    // STEP 1: Define List datatype using ConstructorType
    // ============================================
    
    const listDatatype = new S.DefineDatatype(
      testLoc,
      "List",
      // Parameters: [A : Type]
      [new TypedBinder(new SiteBinder(testLoc, "A"), new S.Universe(testLoc))],
      // Indices: (none)
      [], 
      // Result type: Type
      new S.Universe(testLoc),
      // Constructors: ConstructorType[] (just signatures)
      [
        // nil : List A
        new S.ConstructorType(
          testLoc,
          "nil",
          [], // no arguments
          new S.Application(
            testLoc,
            new S.Name(testLoc, "List"),
            new S.Name(testLoc, "A"),
            []
          )
        ),
        
        // cons : A -> List A -> List A  
        new S.ConstructorType(
          testLoc,
          "cons",
          [
            new TypedBinder(new SiteBinder(testLoc, "head"), new S.Name(testLoc, "A")),
            new TypedBinder(new SiteBinder(testLoc, "tail"), 
              new S.Application(testLoc, new S.Name(testLoc, "List"), new S.Name(testLoc, "A"), [])
            )
          ],
          new S.Application(testLoc, new S.Name(testLoc, "List"), new S.Name(testLoc, "A"), [])
        )
      ]
    );
    
    // ============================================  
    // STEP 2: Use Constructor for actual constructor calls
    // ============================================
    
    // nil (no arguments)
    const nilExpr = new S.Constructor(
      testLoc,
      "nil",
      [], // no actual arguments
      listDatatype
    );
    
    // cons 42 nil  
    const cons42Nil = new S.Constructor(
      testLoc,
      "cons", 
      [
        new S.Number(testLoc, 42),  // head argument
        nilExpr                     // tail argument
      ],
      listDatatype
    );
    
    // cons 1 (cons 42 nil)
    const nestedList = new S.Constructor(
      testLoc,
      "cons",
      [
        new S.Number(testLoc, 1),   // head
        cons42Nil                   // tail
      ],
      listDatatype
    );
    
    // ============================================
    // STEP 3: Eliminator usage
    // ============================================
    
    const listLength = new S.GenericEliminator(
      testLoc,
      "List",
      nestedList, // target: our nested list
      // motive: List A -> Nat
      new S.Lambda(
        testLoc,
        [new SiteBinder(testLoc, "xs")],
        new S.Nat(testLoc)
      ),
      // methods: [nil-case, cons-case]
      [
        // nil case: 0
        new S.Zero(testLoc),
        
        // cons case: λ head tail length_of_tail. add1 length_of_tail
        new S.Lambda(
          testLoc,
          [
            new SiteBinder(testLoc, "head"),
            new SiteBinder(testLoc, "tail"),
            new SiteBinder(testLoc, "length_of_tail")
          ],
          new S.Add1(testLoc, new S.Name(testLoc, "length_of_tail"))
        )
      ]
    );
    
    // ============================================
    // STEP 4: Test the structure
    // ============================================
    
    // Test datatype definition structure
    expect(listDatatype.typeName).toBe("List");
    expect(listDatatype.constructors).toHaveLength(2);
    
    // Test constructor types (in definition)
    const nilCtorType = listDatatype.constructors[0];
    const consCtorType = listDatatype.constructors[1];
    
    expect(nilCtorType).toBeInstanceOf(S.ConstructorType);
    expect(nilCtorType.name).toBe("nil");
    expect(nilCtorType.args).toHaveLength(0);
    
    expect(consCtorType).toBeInstanceOf(S.ConstructorType);
    expect(consCtorType.name).toBe("cons");
    expect(consCtorType.args).toHaveLength(2);
    expect(consCtorType.args[0].binder.varName).toBe("head");
    expect(consCtorType.args[1].binder.varName).toBe("tail");
    
    // Test constructor applications (in expressions)
    expect(nilExpr).toBeInstanceOf(S.Constructor);
    expect(nilExpr.name).toBe("nil");
    expect(nilExpr.args).toHaveLength(0);
    
    expect(cons42Nil).toBeInstanceOf(S.Constructor);
    expect(cons42Nil.name).toBe("cons");
    expect(cons42Nil.args).toHaveLength(2);
    expect(cons42Nil.args[0]).toBeInstanceOf(S.Number);
    expect(cons42Nil.args[1]).toBeInstanceOf(S.Constructor); // nested constructor
    
    // Test eliminator structure
    expect(listLength).toBeInstanceOf(S.GenericEliminator);
    expect(listLength.typeName).toBe("List");
    expect(listLength.target).toBeInstanceOf(S.Constructor);
    expect(listLength.methods).toHaveLength(2);
    
    console.log("✅ Design structure is correct!");
    console.log("ConstructorType used in definitions:", nilCtorType.constructor.name);
    console.log("Constructor used in expressions:", nilExpr.constructor.name);
  });
  
  // it("should demonstrate Vector with indices", () => {
    
  //   // Vec A n datatype
  //   const vecDatatype = new S.DefineDatatype(
  //     testLoc,
  //     "Vec",
  //     [new TypedBinder(new SiteBinder(testLoc, "A"), new S.Universe(testLoc))], // parameters
  //     [new TypedBinder(new SiteBinder(testLoc, "n"), new S.Nat(testLoc))],      // indices
  //     new S.Universe(testLoc),
  //     [
  //       // vnil : Vec A zero
  //       new S.ConstructorType(
  //         testLoc,
  //         "vnil", 
  //         [],
  //         new S.Application(
  //           testLoc,
  //           new S.Name(testLoc, "Vec"),
  //           new S.Name(testLoc, "A"),
  //           [new S.Zero(testLoc)]
  //         )
  //       ),
        
  //       // vcons : (n : Nat) -> A -> Vec A n -> Vec A (add1 n)
  //       new S.ConstructorType(
  //         testLoc,
  //         "vcons",
  //         [
  //           new TypedBinder(new SiteBinder(testLoc, "n"), new S.Nat(testLoc)),
  //           new TypedBinder(new SiteBinder(testLoc, "head"), new S.Name(testLoc, "A")),
  //           new TypedBinder(new SiteBinder(testLoc, "tail"),
  //             new S.Application(testLoc, new S.Name(testLoc, "Vec"), new S.Name(testLoc, "A"), [new S.Name(testLoc, "n")])
  //           )
  //         ],
  //         new S.Application(
  //           testLoc,
  //           new S.Name(testLoc, "Vec"),
  //           new S.Name(testLoc, "A"),
  //           [new S.Add1(testLoc, new S.Name(testLoc, "n"))]
  //         )
  //       )
  //     ]
  //   );
    
  //   // Using constructors: vcons 2 'a' (vcons 1 'b' (vcons 0 'c' vnil))
  //   const vnil = new S.Constructor(testLoc, "vnil", []);
    
  //   const vec1 = new S.Constructor(
  //     testLoc,
  //     "vcons",
  //     [
  //       new S.Zero(testLoc),                    // n = 0
  //       new S.Quote(testLoc, "c"),              // head = 'c'  
  //       vnil                                    // tail = vnil
  //     ]
  //   );
    
  //   const vec2 = new S.Constructor(
  //     testLoc,
  //     "vcons", 
  //     [
  //       new S.Add1(testLoc, new S.Zero(testLoc)), // n = 1
  //       new S.Quote(testLoc, "b"),                 // head = 'b'
  //       vec1                                       // tail = previous vec
  //     ]
  //   );
    
  //   // Test indexed structure
  //   expect(vecDatatype.indices).toHaveLength(1);
  //   expect(vecDatatype.indices[0].binder.varName).toBe("n");
    
  //   const vconsType = vecDatatype.constructors[1];
  //   expect(vconsType.args).toHaveLength(3); // n, head, tail
  //   expect(vconsType.args[0].binder.varName).toBe("n");
    
  //   console.log("✅ Indexed Vec structure is correct!");
  // });
  
});