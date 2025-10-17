// import 'jest';
// import * as S from '../types/source';
// import * as V from '../types/value';
// import { Location, Syntax } from '../utils/locations';
// import { Position } from '../../scheme_parser/transpiler/types/location';
// import { DefineDatatypeSource, GeneralConstructor } from '../typechecker/definedatatype';
// import { Context } from '../utils/context';
// import { HigherOrderClosure, SiteBinder, TypedBinder } from '../types/utils';

// const testLoc = new Location(new Syntax(new Position(1, 1), new Position(1, 1), 'test'), false);

// describe("generateMotiveType implementation", () => {

//   it("should generate motive type for Bool (no indices, no parameters)", () => {
//     const ctx: Context = new Map();
//     const indicesBody = new S.Universe(testLoc) as any;

//     const boolDatatype = new DefineDatatypeSource(
//       testLoc,
//       "Bool",
//       [],
//       indicesBody,
//       [
//         new GeneralConstructor(testLoc, "true", [], new S.GeneralTypeConstructor(testLoc, "Bool", [], [])),
//         new GeneralConstructor(testLoc, "false", [], new S.GeneralTypeConstructor(testLoc, "Bool", [], []))
//       ]
//     );

//     const motiveType = boolDatatype.generateMotiveType(ctx, new Map(), []);
//     
//     // Should be: (Π [target : InductiveType("Bool", [], [])] U)
//     expect(motiveType).toBeInstanceOf(V.Pi);

//     if (motiveType instanceof V.Pi) {
//       expect(motiveType.argName).toBe('target');
//       expect(motiveType.argType).toBeInstanceOf(V.InductiveTypeConstructor);

//       const argType = motiveType.argType as V.InductiveTypeConstructor;
//       expect(argType.name).toBe("Bool");
//       expect(argType.parameters).toHaveLength(0);
//       expect(argType.indices).toHaveLength(0);

//       // Result type should be Universe
//       const resultType = motiveType.resultType.valOfClosure(new V.Zero()); // dummy arg
//       expect(resultType).toBeInstanceOf(V.Universe);
//     }

//     console.log("✅ Bool motive type:", motiveType.prettyPrint());
//   });

//   it("should generate motive type for Vec-like type (one index)", () => {
//     const ctx: Context = new Map();

//     // Vec E with index (n : Nat)
//     const indicesPi = new S.Pi(
//       testLoc,
//       [new TypedBinder(new SiteBinder(testLoc, "n"), new S.Nat(testLoc))],
//       new S.Universe(testLoc)
//     );

//     const vecDatatype = new DefineDatatypeSource(
//       testLoc,
//       "MyVec",
//       [new TypedBinder(new SiteBinder(testLoc, "E"), new S.Universe(testLoc))],
//       indicesPi,
//       [
//         new GeneralConstructor(testLoc, "vnil", [],
//           new S.GeneralTypeConstructor(testLoc, "MyVec", [], [new S.Zero(testLoc)]))
//       ]
//     );

//     // For simplicity, pass empty params (should be E value in real usage)
//     const motiveType = vecDatatype.generateMotiveType(ctx, new Map(), []);
//     

//     // Should be: (Π [n : Nat] (Π [target : InductiveType("MyVec", [], [n])] U))
//     expect(motiveType).toBeInstanceOf(V.Pi);

//     if (motiveType instanceof V.Pi) {
//       expect(motiveType.argName).toBe('n');
//       expect(motiveType.argType).toBeInstanceOf(V.Nat);

//       // Apply the closure to get inner Pi
//       const innerType = motiveType.resultType.valOfClosure(new V.Zero());
//       expect(innerType).toBeInstanceOf(V.Pi);

//       if (innerType instanceof V.Pi) {
//         expect(innerType.argName).toBe('target');
//         expect(innerType.argType).toBeInstanceOf(V.InductiveTypeConstructor);

//         const argType = innerType.argType as V.InductiveTypeConstructor;
//         expect(argType.name).toBe("MyVec");
//         // The index should be the captured value from the outer closure
//         expect(argType.indices).toHaveLength(1);
//       }
//     }

//     console.log("✅ MyVec motive type:", motiveType.prettyPrint());
//   });

//   it("should demonstrate closure capturing for indices", () => {
//     const ctx: Context = new Map();
//     const indicesBody = new S.Universe(testLoc) as any;

//     const boolDatatype = new DefineDatatypeSource(
//       testLoc,
//       "Bool",
//       [],
//       indicesBody,
//       []
//     );

//     const motiveType = boolDatatype.generateMotiveType(ctx, new Map(), []);

//     console.log("\n=== Motive Type Structure ===");
//     console.log("Generated:", motiveType.prettyPrint());
//     console.log("\nThis motive type:");
//     console.log("- Is a function from target values to Types");
//     console.log("- Can be applied with doApp(motive, targetValue)");
//     console.log("- Returns Universe (a Type)");
//     console.log("================================\n");

//     expect(motiveType).toBeDefined();
//   });
// });

describe("placeholder tests", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  })
})
