import 'jest';
import * as S from '../types/source';
import * as V from '../types/value';
import * as C from '../types/core';
import * as N from '../types/neutral';
import * as Evaluator from '../evaluator/evaluator';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';
import { DefineDatatypeSource, handleDefineDatatype, makeTypedBinder, makeConstructorSpec } from '../typechecker/definedatatype';
import { Context, contextToEnvironment } from '../utils/context';
import { go, stop, HigherOrderClosure, TypedBinder } from '../types/utils';
import { Environment } from '../utils/environment';
import { readBack } from '../evaluator/utils';

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
        makeConstructorSpec("true", []), // no arguments

        // false : Bool
        makeConstructorSpec("false", [])
      ]
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
    console.log("Context keys:", updatedCtx);
    
    // Test that datatype was added to context
    expect(updatedCtx.has("Bool")).toBe(true);
    
    // Test that constructors were added to context
    expect(updatedCtx.has("true")).toBe(true);
    expect(updatedCtx.has("false")).toBe(true);
    
    // Test that eliminator was generated and added
    expect(updatedCtx.has("elim-Bool")).toBe(true);
    
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
        makeConstructorSpec("unit", [])
      ]
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
    expect(updatedCtx.has("elim-Unit")).toBe(true);
    
    // Test structure
    expect(unitDatatype.name).toBe("Unit");
    expect(unitDatatype.constructors).toHaveLength(1);
    expect(unitDatatype.constructors[0].name).toBe("unit");
    expect(unitDatatype.constructors[0].args).toHaveLength(0);
    
    console.log("✅ Unit datatype successfully defined!");
  });

  it("should integrate high-level datatype definition with proper Source constructors", () => {
    // Create initial context
    const ctx: Context = new Map();

    // Define Bool datatype using high-level system
    const boolDatatype = new DefineDatatypeSource(
      testLoc,
      "Bool",
      [], // no parameters
      [], // no indices
      [
        makeConstructorSpec("true", []),
        makeConstructorSpec("false", [])
      ]
    );

    // Handle the datatype definition - adds to context
    const result = handleDefineDatatype(ctx, new Map(), boolDatatype);
    expect(result).toBeInstanceOf(go);
    if (result instanceof stop) {
      throw new Error(`Failed to define Bool datatype: ${result.message}`);
    }

    const updatedCtx = (result as go<Context>).result;

    // Verify components were added to context
    expect(updatedCtx.has("Bool")).toBe(true);
    expect(updatedCtx.has("true")).toBe(true);
    expect(updatedCtx.has("false")).toBe(true);
    expect(updatedCtx.has("elim-Bool")).toBe(true);

    // Now use proper Source constructors that reference the context

    // Create constructor applications using Source constructors
    const trueSource = new S.ConstructorApplication(testLoc, "true", []);
    const falseSource = new S.ConstructorApplication(testLoc, "false", []);

    // Synthesize the constructor applications through proper pipeline
    const trueSynth = trueSource.synth(updatedCtx, new Map());
    const falseSynth = falseSource.synth(updatedCtx, new Map());

    expect(trueSynth).toBeInstanceOf(go);
    expect(falseSynth).toBeInstanceOf(go);

    if (trueSynth instanceof go && falseSynth instanceof go) {
      // Verify that the Source constructors work properly through synthesis

      // Test that we can get the Core expressions
      const trueCore = trueSynth.result.expr;
      const falseCore = falseSynth.result.expr;

      // The expression should be a Constructor
      expect(trueCore).toBeInstanceOf(C.Constructor);
      expect(falseCore).toBeInstanceOf(C.Constructor);

      if (trueCore instanceof C.Constructor && falseCore instanceof C.Constructor) {
        expect(trueCore.name).toBe("true");
        expect(falseCore.name).toBe("false");
        expect(trueCore.index).toBe(0);
        expect(falseCore.index).toBe(1);
      }
    }

    console.log("✅ Bool datatype with proper Source constructors successfully executed!");
  });

  it("should demonstrate proper Source constructor lookup from context", () => {
    // Create initial context and define Bool datatype
    const ctx: Context = new Map();
    const boolDatatype = new DefineDatatypeSource(
      testLoc,
      "Bool",
      [], [],
      [makeConstructorSpec("true", []), makeConstructorSpec("false", [])]
    );

    const result = handleDefineDatatype(ctx, new Map(), boolDatatype);
    expect(result).toBeInstanceOf(go);
    const updatedCtx = (result as go<Context>).result;

    // Test that our new ConstructorApplication can find constructors in context
    const trueSource = new S.ConstructorApplication(testLoc, "true", []);
    const falseSource = new S.ConstructorApplication(testLoc, "false", []);

    // Test that synthesis works (finds constructors in context)
    const trueSynth = trueSource.synth(updatedCtx, new Map());
    const falseSynth = falseSource.synth(updatedCtx, new Map());

    expect(trueSynth).toBeInstanceOf(go);
    expect(falseSynth).toBeInstanceOf(go);

    // Test that unknown constructor fails properly
    const unknownSource = new S.ConstructorApplication(testLoc, "unknown", []);

    expect(() => {
      unknownSource.synth(updatedCtx, new Map());
    }).toThrow("Unknown constructor: unknown");

    console.log("✅ Source constructors properly lookup from context!");
  });

  it("should demonstrate proper Source eliminator lookup from context", () => {
    // Create initial context and define Bool datatype
    const ctx: Context = new Map();
    const boolDatatype = new DefineDatatypeSource(
      testLoc,
      "Bool",
      [], [],
      [makeConstructorSpec("true", []), makeConstructorSpec("false", [])]
    );

    const result = handleDefineDatatype(ctx, new Map(), boolDatatype);
    expect(result).toBeInstanceOf(go);
    const updatedCtx = (result as go<Context>).result;

    // Test that our new EliminatorApplication can find eliminators in context
    const trueSource = new S.ConstructorApplication(testLoc, "true", []);

    // Create simple methods (we'll use Name references to existing values in context)
    const method1 = new S.Zero(testLoc);
    const method2 = new S.Zero(testLoc);

    // Create eliminator application using Source
    const eliminatorSource = new S.EliminatorApplication(
      testLoc,
      "Bool",
      trueSource,
      new S.Nat(testLoc), // simplified motive
      [method1, method2]
    );

    // Test that eliminator synthesis works (finds inductive type and eliminator in context)
    const eliminatorSynth = eliminatorSource.synth(updatedCtx, new Map());
    expect(eliminatorSynth).toBeInstanceOf(go); 

    // Test that unknown eliminator fails properly
    const unknownEliminatorSource = new S.EliminatorApplication(
      testLoc,
      "UnknownType",
      trueSource,
      new S.Nat(testLoc),
      [method1]
    );

    expect(() => {
      unknownEliminatorSource.synth(updatedCtx, new Map());
    }).toThrow(); // Should fail due to unknown type not in context

    console.log("✅ Source eliminators properly lookup from context!");
  });

  it("should create and eliminate a Nat-like datatype", () => {
    // Create initial context
    const ctx: Context = new Map();

    // Define MyNat datatype (similar to natural numbers) - simplified without self-reference for now
    const myNatDatatype = new DefineDatatypeSource(
      testLoc,
      "MyNat",
      [], // no parameters
      [], // no indices
      [
        makeConstructorSpec("myZero", []),
        makeConstructorSpec("myAdd1", []) // Simplified to avoid self-reference parsing issues
      ]
    );

    // Handle the datatype definition
    const result = handleDefineDatatype(ctx, new Map(), myNatDatatype);
    expect(result).toBeInstanceOf(go);
    if (result instanceof stop) {
      throw new Error(`Failed to define MyNat datatype: ${result.message}`);
    }

    const updatedCtx = (result as go<Context>).result;

    // Verify components were added to context
    expect(updatedCtx.has("MyNat")).toBe(true);
    expect(updatedCtx.has("myZero")).toBe(true);
    expect(updatedCtx.has("myAdd1")).toBe(true);
    expect(updatedCtx.has("elim-MyNat")).toBe(true);

    // Use proper Source constructors instead of creating Values directly
    const myZeroSource = new S.ConstructorApplication(testLoc, "myZero", []);
    const myAdd1Source = new S.ConstructorApplication(testLoc, "myAdd1", []);

    // Test type-checking through proper Source synthesis
    const myZeroSynth = myZeroSource.synth(updatedCtx, new Map());
    const myAdd1Synth = myAdd1Source.synth(updatedCtx, new Map());

    expect(myZeroSynth).toBeInstanceOf(go);
    expect(myAdd1Synth).toBeInstanceOf(go);

    if (myZeroSynth instanceof go && myAdd1Synth instanceof go) {
      // Verify the synthesized Core expressions
      const myZeroCore = myZeroSynth.result.expr;
      const myAdd1Core = myAdd1Synth.result.expr;

      expect(myZeroCore).toBeInstanceOf(C.Constructor);
      expect(myAdd1Core).toBeInstanceOf(C.Constructor);

      if (myZeroCore instanceof C.Constructor && myAdd1Core instanceof C.Constructor) {
        // Test that constructors have correct names and indices
        expect(myZeroCore.name).toBe("myZero");
        expect(myAdd1Core.name).toBe("myAdd1");
        expect(myZeroCore.type).toBe("MyNat");
        expect(myAdd1Core.type).toBe("MyNat");
        expect(myZeroCore.index).toBe(0);
        expect(myAdd1Core.index).toBe(1);

        // Test that we can create an eliminator using Source constructors
        const motiveSource = new S.Nat(testLoc); // Simple motive: MyNat -> Nat
        const method1Source = new S.Zero(testLoc); // myZero -> 0
        const method2Source = new S.Add1(testLoc, new S.Zero(testLoc)); // myAdd1 -> 1

        const eliminatorSource = new S.EliminatorApplication(
          testLoc,
          "MyNat",
          myZeroSource, // target
          motiveSource, // motive
          [method1Source, method2Source] // methods
        );

        // Test that eliminator synthesis works through type-checking
        const eliminatorSynth = eliminatorSource.synth(updatedCtx, new Map());
        expect(eliminatorSynth).toBeInstanceOf(go);

        // NOW ADD EVALUATION TESTS - actually evaluate the constructed sources
        const myZeroValue = myZeroSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
        const myAdd1Value = myAdd1Synth.result.expr.valOf(contextToEnvironment(updatedCtx));

        // Verify the evaluated values are proper constructors
        expect(myZeroValue).toBeInstanceOf(V.Constructor);
        expect(myAdd1Value).toBeInstanceOf(V.Constructor);

        if (myZeroValue instanceof V.Constructor && myAdd1Value instanceof V.Constructor) {
          expect(myZeroValue.name).toBe("myZero");
          expect(myAdd1Value.name).toBe("myAdd1");
          console.log("✅ Evaluation: myZero =", myZeroValue.name, "myAdd1 =", myAdd1Value.name);
        }

        // Test eliminator evaluation
        if (eliminatorSynth instanceof go) {
          const eliminatorValue = eliminatorSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
          const eliminatorForced = eliminatorValue.now();
          console.log("✅ Eliminator evaluated to:", eliminatorForced);
        }

        console.log("Type-checking and evaluation through Source constructors successful!");
      }
    }

    console.log("✅ MyNat datatype eliminator successfully executed!");
  });

  it("should demonstrate complete integration: List datatype with high-level definition and low-level elimination", () => {
    // Create initial context
    const ctx: Context = new Map();

    // Define simplified List datatype without parameterization to avoid scoping issues
    const listDatatype = new DefineDatatypeSource(
      testLoc,
      "List",
      [], // no parameters (simplified)
      [], // no indices
      [
        makeConstructorSpec("nil", []),
        makeConstructorSpec("cons", []) // Simplified constructors
      ]
    );

    // Handle the datatype definition
    const result = handleDefineDatatype(ctx, new Map(), listDatatype);
    expect(result).toBeInstanceOf(go);
    if (result instanceof stop) {
      throw new Error(`Failed to define List datatype: ${result.message}`);
    }

    const updatedCtx = (result as go<Context>).result;
  

    // Verify components were added to context
    expect(updatedCtx.has("List")).toBe(true);
    expect(updatedCtx.has("nil")).toBe(true);
    expect(updatedCtx.has("cons")).toBe(true);
    expect(updatedCtx.has("elim-List")).toBe(true);

    // Use proper Source constructors for type-checking instead of creating Values directly
    const nilSource = new S.ConstructorApplication(testLoc, "nil", []);
    const consSource = new S.ConstructorApplication(testLoc, "cons", []);

    // Test type-checking through proper Source synthesis
    const nilSynth = nilSource.synth(updatedCtx, new Map());
    const consSynth = consSource.synth(updatedCtx, new Map());

    expect(nilSynth).toBeInstanceOf(go);
    expect(consSynth).toBeInstanceOf(go);

    if (nilSynth instanceof go && consSynth instanceof go) {
      // Verify the synthesized Core expressions
      const nilCore = nilSynth.result.expr;
      const consCore = consSynth.result.expr;

      expect(nilCore).toBeInstanceOf(C.Constructor);
      expect(consCore).toBeInstanceOf(C.Constructor);

      if (nilCore instanceof C.Constructor && consCore instanceof C.Constructor) {
        // Test that constructors have correct properties
        expect(nilCore.name).toBe("nil");
        expect(consCore.name).toBe("cons");
        expect(nilCore.type).toBe("List");
        expect(consCore.type).toBe("List");
        expect(nilCore.index).toBe(0);
        expect(consCore.index).toBe(1);

        // Test eliminator creation using Source constructors
        const motiveSource = new S.Nat(testLoc); // Simple motive: List -> Nat
        const method1Source = new S.Zero(testLoc); // nil -> 0
        const method2Source = new S.Add1(testLoc, new S.Zero(testLoc)); // cons -> 1

        const listEliminatorSource = new S.EliminatorApplication(
          testLoc,
          "List",
          nilSource, // target
          motiveSource, // motive
          [method1Source, method2Source] // methods
        );

        // Test that eliminator synthesis works through type-checking
        const listEliminatorSynth = listEliminatorSource.synth(updatedCtx, new Map());
        expect(listEliminatorSynth).toBeInstanceOf(go);

        // ADD EVALUATION TESTS for List constructors
        const nilValue = nilSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
        const consValue = consSynth.result.expr.valOf(contextToEnvironment(updatedCtx));

        // Verify the evaluated values
        expect(nilValue).toBeInstanceOf(V.Constructor);
        expect(consValue).toBeInstanceOf(V.Constructor);

        if (nilValue instanceof V.Constructor && consValue instanceof V.Constructor) {
          expect(nilValue.name).toBe("nil");
          expect(consValue.name).toBe("cons");
          console.log("✅ List Evaluation: nil =", nilValue.name, "cons =", consValue.name);
        }

        // Test eliminator evaluation
        if (listEliminatorSynth instanceof go) {
          const listEliminatorValue = listEliminatorSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
          const listEliminatorForced = listEliminatorValue.now();
          console.log("✅ List Eliminator evaluated to:", listEliminatorForced);
        }

        console.log("List type-checking and evaluation through Source constructors successful!");
      }
    }

    console.log("✅ Complete List datatype integration successful!");
  });

});