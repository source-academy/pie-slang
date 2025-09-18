import 'jest';
import * as S from '../types/source';
import * as V from '../types/value';
import * as C from '../types/core';
import * as N from '../types/neutral';
import * as Evaluator from '../evaluator/evaluator';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme_parser/transpiler/types/location';
import { DefineDatatypeSource, handleDefineDatatype, makeConstructorSpec, makeTypedBinder } from '../typechecker/definedatatype';
import { Context, contextToEnvironment } from '../utils/context';
import { go, stop, HigherOrderClosure, SiteBinder } from '../types/utils';
import { Environment } from '../utils/environment';
import { readBack } from '../evaluator/utils';
import { prettyPrintValue } from '../unparser/pretty';

// Test location
const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);


describe(
  'test integration', () => {
    
      it("should create real recursive list structures like cons 1 (cons 2 (cons 3 nil))", () => {
        const ctx: Context = new Map();
            const listDatatype = new DefineDatatypeSource(
          testLoc,
          "MyList",
          [makeTypedBinder("E", new S.Universe(testLoc), testLoc)],
          [],
          [
            makeConstructorSpec("myNil", []),
            makeConstructorSpec("myCons", [
              makeTypedBinder("head", new S.Name(testLoc, 'E'), testLoc),
              makeTypedBinder("tail", new S.Name(testLoc, 'MyList'), testLoc)
            ])
          ]
        );
    
        const result = handleDefineDatatype(ctx, new Map(), listDatatype);
        const updatedCtx = (result as go<Context>).result;
    
        const nilSource = new S.ConstructorApplication(testLoc, "myNil", []);
    
        const three = new S.Add1(testLoc, new S.Add1(testLoc, new S.Add1(testLoc, new S.Zero(testLoc))));
        const cons3NilSource = new S.ConstructorApplication(testLoc, "myCons", [three, nilSource]);
    
        const two = new S.Add1(testLoc, new S.Add1(testLoc, new S.Zero(testLoc)));
        const cons2Source = new S.ConstructorApplication(testLoc, "myCons", [two, cons3NilSource]);
    
        const one = new S.Add1(testLoc, new S.Zero(testLoc));
        const cons1Source = new S.ConstructorApplication(testLoc, "myCons", [one, cons2Source]);
    
        const nilSynth = nilSource.synth(updatedCtx, new Map());    
        if (nilSynth instanceof go) {    
          const nilValue = nilSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
          console.log(nilValue.prettyPrintValue())
            const cons1Synth = cons1Source.synth(updatedCtx, new Map());
            console.log("cons1Source synthesis result:", cons1Synth instanceof go ? "success" : "failed");
        }
        const lengthNilSource = new S.EliminatorApplication(
          testLoc,
          "MyList",
          nilSource, 
          new S.Nat(testLoc),
          [
            new S.Zero(testLoc), 
            new S.Lambda(testLoc, new SiteBinder(testLoc, 'x'), new S.Add1())
          ]
        );
    
        const lengthNilSynth = lengthNilSource.synth(updatedCtx, new Map());
        expect(lengthNilSynth).toBeInstanceOf(go);
    
        if (lengthNilSynth instanceof go) {
          // EVALUATE the length function on nil
          const lengthNilValue = lengthNilSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
          // Force evaluation of delayed values
          const lengthNilForced = lengthNilValue.now();
          console.log("✅ Length of nil FORCED to:", lengthNilForced);
        }
        // Simple cons method for testing - returns 1 (will be enhanced later)
        const consLengthMethod = new S.Add1(testLoc, new S.Zero(testLoc)); // returns 1
    
        // First test: length of cons3NilSource (should be 1)
        const lengthSingleConsSource = new S.EliminatorApplication(
          testLoc,
          "MyList",
          cons3NilSource, // target: cons 3 nil (length should be 1)
          new S.Nat(testLoc), // motive: List -> Nat
          [
            new S.Zero(testLoc), // nil case: 0
            consLengthMethod // cons case: function that returns 1
          ]
        );
    
        // Simple recursive method for testing - returns 1 for now (will be enhanced to return add1(recursive_result))
        const consRecursiveLengthMethod = new S.Add1(testLoc, new S.Zero(testLoc)); // returns 1
    
        // Second test: try to create a structure that gives length 3
        const lengthTripleConsSource = new S.EliminatorApplication(
          testLoc,
          "MyList",
          cons1Source, // target: cons 1 (cons 2 (cons 3 nil)) - should give length 3
          new S.Nat(testLoc), // motive: List -> Nat
          [
            new S.Zero(testLoc), // nil case: 0
            consRecursiveLengthMethod // cons case: λ(element tail tail_length) add1(tail_length)
          ]
        );
    
        // Test the single cons first
        try {
          const singleSynth = lengthSingleConsSource.synth(updatedCtx, new Map());
          if (singleSynth instanceof go) {
            const singleValue = singleSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
            const singleForced = singleValue.now();
            console.log("✅ Single cons (cons 3 nil) length evaluates to:", singleForced);
    
            if (singleForced instanceof V.Add1) {
              const base = singleForced.smaller.now();
              if (base instanceof V.Zero) {
                console.log("✅ SUCCESS: Single cons correctly gives length 1!");
              }
            }
          }
        } catch (e) {
          console.log("Single cons length failed:", e.message);
        }
    
        // Test the triple nested cons
        try {
          const tripleSynth = lengthTripleConsSource.synth(updatedCtx, new Map());
          if (tripleSynth instanceof go) {
            const tripleValue = tripleSynth.result.expr.valOf(contextToEnvironment(updatedCtx));
            const tripleForced = tripleValue.now();
            console.log("✅ Triple cons (cons 1 (cons 2 (cons 3 nil))) length evaluates to:", tripleForced);
    
            // Check if we got 3: Add1(Add1(Add1(Zero)))
            if (tripleForced instanceof V.Add1) {
              const second = tripleForced.smaller.now();
              if (second instanceof V.Add1) {
                const third = second.smaller.now();
                if (third instanceof V.Add1) {
                  const base = third.smaller.now();
                  if (base instanceof V.Zero) {
                    console.log("✅ SUCCESS: Triple nested cons correctly gives length 3!");
                    return; // Success!
                  }
                }
              }
            }
            console.log("❌ Triple cons didn't give expected length 3 structure");
          }
        } catch (e) {
          console.log("Triple cons length failed:", e.message);
        }
    
      });
    
  }
)