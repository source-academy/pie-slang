
import { Ctx, ctxToEnv, Def, Free } from '../basics'

describe("ctxToEnv", () => {
  it("should return an empty environment for an empty context", () => {
    const ctx: Ctx = [];
    const result = ctxToEnv(ctx);
    expect(result).toEqual([]);
  });

  it("should handle a context with a single Def binding", () => {
    const ctx: Ctx = [[Symbol("x"), new Def("NAT", "ZERO")]];
    const result = ctxToEnv(ctx);
    
  });

  // it("should handle a context with a single Free binding", () => {
  //   const ctx: Ctx = [["y", new Free("Type")]];
  //   const result = ctxToEnv(ctx);
  //   expect(result).toEqual([["y", new NEU("Type", new N_Var("y"))]]);
  // });

  // it("should skip claiml bindings", () => {
  //   const claiml = {}; // assuming claiml is represented by an empty object or some other type
  //   const ctx: Ctx = [["z", claiml]];
  //   const result = ctxToEnv(ctx);
  //   expect(result).toEqual([]);
  // });

  // it("should handle a mix of Def, Free, and claiml bindings", () => {
  //   const claiml = {};
  //   const ctx: Ctx = [
  //     ["x", new Def(42)],
  //     ["y", new Free("Type")],
  //     ["z", claiml],
  //   ];
  //   const result = ctxToEnv(ctx);
  //   expect(result).toEqual([
  //     ["x", 42],
  //     ["y", new NEU("Type", new N_Var("y"))],
  //   ]);
  // });

  // it("should handle nested context", () => {
  //   const ctx: Ctx = [
  //     ["x", new Def(1)],
  //     ["y", new Free("Bool")],
  //     ["z", new Def(3)],
  //   ];
  //   const result = ctxToEnv(ctx);
  //   expect(result).toEqual([
  //     ["x", 1],
  //     ["y", new NEU("Bool", new N_Var("y"))],
  //     ["z", 3],
  //   ]);
  // });
});

const ctx0: Ctx = [[Symbol("x"), new Def("NAT", "ZERO")]];
const result0 = ctxToEnv(ctx0);

const ctx1: Ctx = [[Symbol("y"), new Free("NAT")]];
const result1 = ctxToEnv(ctx1);

/* const ctx2: Ctx = [[Symbol("z"), new Claim("NAT")]];
const result2 = ctxToEnv(ctx2);
console.log(result2)

const claiml = {};
const ctx3: Ctx = [
  [Symbol("x"), new Def("NAT", "ZERO")],
  [Symbol("y"), new Free("ATOM")],
  [Symbol("z"), new Claim("NAT")],
];
var env0 = ctxToEnv(ctx3)
console.log(env0)

env0 = extendEnv(env0, Symbol("b"), "NAT")

env0 = extendEnv(env0, Symbol("a"), new LAM(Symbol("func"), new FO_CLOS(env0, Symbol("func1"), 'Absurd')))

env0 = extendEnv(env0, Symbol("pi"), new PI(Symbol("pi"), "UNIVERSE", new FO_CLOS(env0, Symbol("pi"), "Absurd")))
console.log(env0)

const v = varVal(env0, Symbol('a'))
console.log(v)

const t = varType(ctx3, null, Symbol("y"))
console.log(t)
*/
