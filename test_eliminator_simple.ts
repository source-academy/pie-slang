import 'jest';
import * as S from './src/pie_interpreter/types/source';
import * as V from './src/pie_interpreter/types/value';
import * as C from './src/pie_interpreter/types/core';
import { Location, Syntax } from './src/pie_interpreter/utils/locations';
import { Position } from './src/scheme_parser/transpiler/types/location';
import { DefineDatatypeSource, handleDefineDatatype, makeConstructorSpec, makeTypedBinder, GeneralConstructor } from './src/pie_interpreter/typechecker/definedatatype';
import { Context, contextToEnvironment } from './src/pie_interpreter/utils/context';
import { go, stop } from './src/pie_interpreter/types/utils';

// Test location
const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);

describe("Simple Eliminator Test", () => {
  it("should define Bool and create an eliminator", () => {
    const ctx: Context = new Map();

    // Create Bool datatype with simple constructors
    const trueConstructor = new GeneralConstructor(
      testLoc,
      "true",
      [],
      new S.GeneralTypeConstructor(testLoc, "Bool", [], [])
    );

    const falseConstructor = new GeneralConstructor(
      testLoc,
      "false",
      [],
      new S.GeneralTypeConstructor(testLoc, "Bool", [], [])
    );

    const boolDatatype = new DefineDatatypeSource(
      testLoc,
      "Bool",
      [],
      new S.Pi(testLoc, [], new S.Universe(testLoc)),
      [trueConstructor, falseConstructor]
    );

    // Handle the datatype definition
    const result = handleDefineDatatype(ctx, new Map(), boolDatatype);
    expect(result).toBeInstanceOf(go);

    if (result instanceof stop) {
      throw new Error(`Failed to define Bool: ${result.message}`);
    }

    const updatedCtx = (result as go<Context>).result;

    // Verify everything was added to context
    console.log("Context keys:", Array.from(updatedCtx.keys()));
    expect(updatedCtx.has("Bool")).toBe(true);
    expect(updatedCtx.has("true")).toBe(true);
    expect(updatedCtx.has("false")).toBe(true);
    expect(updatedCtx.has("elim-Bool")).toBe(true);

    // Create constructor applications
    const trueSource = new S.ConstructorApplication(testLoc, "true", []);
    const falseSource = new S.ConstructorApplication(testLoc, "false", []);

    // Test synthesis
    const trueSynth = trueSource.synth(updatedCtx, new Map());
    const falseSynth = falseSource.synth(updatedCtx, new Map());

    expect(trueSynth).toBeInstanceOf(go);
    expect(falseSynth).toBeInstanceOf(go);

    // Create eliminator
    const eliminator = new S.EliminatorApplication(
      testLoc,
      "Bool",
      trueSource,
      new S.Nat(testLoc),
      [new S.Zero(testLoc), new S.Add1(testLoc, new S.Zero(testLoc))]
    );

    // Test eliminator synthesis
    const elimSynth = eliminator.synth(updatedCtx, new Map());
    console.log("Eliminator synthesis result:", elimSynth);

    if (elimSynth instanceof stop) {
      console.error("Eliminator failed:", elimSynth.message);
    }

    expect(elimSynth).toBeInstanceOf(go);

    console.log("✅ Bool eliminator test passed!");
  });
});
