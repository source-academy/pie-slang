import 'jest';
import * as S from '../types/source';
import * as V from '../types/value';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';
import { DefineDatatypeSource, handleDefineDatatype } from '../typechecker/definedatatype';
import { Context } from '../utils/context';
import { go, stop } from '../types/utils';

// Test location
const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);

describe("DefineDatatype Test", () => {
  
  it("should define a simple Bool datatype and add it to context", () => {
    
    // Create initial context
    const ctx: Context = new Map();
    
    // Define simple Bool datatype using DefineDatatypeSource
    const boolDatatype = new DefineDatatypeSource(
      testLoc,
      "Bool",
      // Parameters: (none)
      [],
      // Indices: (none)
      [], 
      // Constructors with their argument types
      [
        // true : Bool
        {
          name: "true",
          args: [] // no arguments
        },
        
        // false : Bool
        {
          name: "false",
          args: []
        }
      ],
      new V.Universe() // typeValue placeholder
    );
    
    // Handle the datatype definition - adds to context
    const result = handleDefineDatatype(ctx, new Map(), boolDatatype);
    
    // Check that the definition succeeded
    expect(result).toBeInstanceOf(go);
    if (result instanceof stop) {
      throw new Error(`Failed to define datatype: ${result.message}`);
    }
    
    const updatedCtx = (result as go<Context>).result;
    
    // Debug: print what's in the context
    console.log("Context keys:", Array.from(updatedCtx.keys()));
    
    // Test that datatype was added to context
    expect(updatedCtx.has("Bool")).toBe(true);
    
    // Test that constructors were added to context
    expect(updatedCtx.has("true")).toBe(true);
    expect(updatedCtx.has("false")).toBe(true);
    
    // Test that eliminator was generated and added
    expect(updatedCtx.has("elimBool")).toBe(true);
    
    // Test the structure of the DefineDatatypeSource
    expect(boolDatatype.name).toBe("Bool");
    expect(boolDatatype.parameters).toHaveLength(0);
    expect(boolDatatype.indices).toHaveLength(0);
    expect(boolDatatype.constructors).toHaveLength(2);
    
    // Test constructor definitions
    const trueCtor = boolDatatype.constructors[0];
    const falseCtor = boolDatatype.constructors[1];
    
    expect(trueCtor.name).toBe("true");
    expect(trueCtor.args).toHaveLength(0);
    
    expect(falseCtor.name).toBe("false");
    expect(falseCtor.args).toHaveLength(0);
    
    console.log("✅ Bool datatype successfully defined and added to context!");
  });
  
  it("should define a Unit datatype with single constructor", () => {
    // Create initial context
    const ctx: Context = new Map();
    
    // Define Unit datatype (simple case with one constructor)
    const unitDatatype = new DefineDatatypeSource(
      testLoc,
      "Unit",
      [], // no parameters
      [], // no indices
      [
        // unit : Unit
        {
          name: "unit",
          args: []
        }
      ],
      new V.Universe()
    );
    
    // Handle the datatype definition
    const result = handleDefineDatatype(ctx, new Map(), unitDatatype);
    
    expect(result).toBeInstanceOf(go);
    if (result instanceof stop) {
      throw new Error(`Failed to define Unit datatype: ${result.message}`);
    }
    
    const updatedCtx = (result as go<Context>).result;
    
    // Test that all components were added to context
    expect(updatedCtx.has("Unit")).toBe(true);
    expect(updatedCtx.has("unit")).toBe(true);
    expect(updatedCtx.has("elimUnit")).toBe(true);
    
    // Test structure
    expect(unitDatatype.name).toBe("Unit");
    expect(unitDatatype.constructors).toHaveLength(1);
    expect(unitDatatype.constructors[0].name).toBe("unit");
    expect(unitDatatype.constructors[0].args).toHaveLength(0);
    
    console.log("✅ Unit datatype successfully defined!");
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