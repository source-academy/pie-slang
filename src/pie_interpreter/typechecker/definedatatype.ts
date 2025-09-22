import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { go, Perhaps, stop, fresh, TypedBinder, Message, SiteBinder, HigherOrderClosure } from '../types/utils';
import { Context, extendContext, InductiveDatatypePlaceholder, InductiveDatatypeBinder, ConstructorBinder, contextToEnvironment, EliminatorBinder, valInContext, bindFree, getClaim } from '../utils/context';
import { Location } from '../utils/locations';
import { extendRenaming, Renaming } from './utils';
import { Environment } from '../utils/environment';
import { VarName } from '../types/core';
import { synthesizer } from './synthesizer';

function isRecursiveArgumentType(argType: S.Source, datatypeName: string): boolean {
  if (argType instanceof S.Name && argType.name === datatypeName) {
    return true;
  }

  if (argType instanceof S.Application &&
      argType.func instanceof generalInductiveType &&
      argType.func.name === datatypeName) {
    return true;
  }

  return false;
}

export class generalInductiveType extends S.Source {
  public findNames(): string[] {
    throw new Error('Method not implemented.');
  }
  public prettyPrint(): string {
    throw new Error('Method not implemented.');
  }
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    const resultTemp = getClaim(ctx, this.location, this.name)
    if (resultTemp instanceof stop) {
      return resultTemp
    }

    const result = (resultTemp as go<V.Value>).result
    return result.readBackType(ctx)
  }
  constructor(
    public location: Location,
    public name: string,
    args: SiteBinder
  ) {super(location)}


}

export class DefineDatatypeSource {
  constructor(
    public location: Location,
    public name: string,
    public parameters: TypedBinder[],
    public indices: S.Pi,
    public constructors: S.Pi[],
    public eliminatorName?: string
  ) { }

  public toString(): string {
    const params = this.parameters.map(p => p.prettyPrint()).join(' ');
    const indices = this.indices.prettyPrint();
    const ctors = this.constructors.map(p => p.prettyPrint()).join(' ');
    return `data ${this.name} (${params}) (${indices}) ${ctors}`;
  }

  // checkOneType(ctx: Context, rename: Renaming, binder: SiteBinder, type:S.Source) {
  //   const xhat = fresh(ctx, binder.varName)
  //   const result = type.check(ctx, rename, new V.Universe())
  //   if (result instanceof go) {
  //     return new go(
  //       new ContextAndRenaming(
  //       bindFree(ctx, xhat, valInContext(ctx, result.result)),
  //       extendRenaming(rename, binder.varName, xhat)
  //     ))
  //   } else {
  //     throw (result as stop).message
  //   }
  // }

  // checkParams(ctx: Context, rename:Renaming) {
  //   let cur_ctx = ctx;
  //   let cur_rename = rename
  //   for (const param of this.parameters) {
  //     const result = this.checkOneType(cur_ctx, cur_rename, param.binder, param.type)
  //     if (result instanceof go) {
  //       const cur_result= (result as go<ContextAndRenaming>).result
  //       cur_ctx = cur_result.ctx
  //       cur_rename = cur_result.rename
  //     } else {
  //       throw (result as stop).message
  //     }
  //   }
  //   return new go(new ContextAndRenaming(cur_ctx, cur_rename))
  // }

  // synthIndices(ctx: Context, rename:Renaming) {
  //   return this.indices.synth(ctx, rename)
  // }

  buildMainTypeAndConstructor(ctx: Context, rename:Renaming) {
    const mainTypeTemp =  new S.Pi(this.location, this.parameters, this.indices).getType(ctx, rename)
    if (mainTypeTemp instanceof stop) {
      return mainTypeTemp
    }
    const namehat = fresh(ctx, this.name)
    let cur_ctx = bindFree(ctx, namehat, 
      valInContext(ctx, (mainTypeTemp as go<C.Pi>).result)
    )
    let cur_rename = extendRenaming(rename, this.name, namehat)

    let constructorls = this.constructors.map(
      ctor => ctor.synth(cur_ctx, cur_rename)
    )
  }

  findAllRecTypes(ctor:S.Pi, acc: string[]) {

  }

  handleConstructor(ctx:Context, rename:Renaming, ctor:S.Pi) {

  }





  

  public typeSynth(ctx: Context, rename: Renaming): Perhaps<DefineDatatypeCore> {
    let currentCtx = ctx;
    const synthedParameters: C.Core[] = [];

    for (const param of this.parameters) {
      const paramTypeResult = param.type.isType(currentCtx, rename);
      if (paramTypeResult instanceof stop) {
        return new stop(param.binder.location, new Message([`Parameter type is not a type: ${paramTypeResult.message}`]));
      }

      const paramTypeCore = (paramTypeResult as go<C.Core>).result;
      synthedParameters.push(paramTypeCore);

      // Extend context with this parameter for subsequent parameters and indices
      currentCtx = bindFree(currentCtx, param.binder.varName, valInContext(currentCtx, paramTypeCore));
    }

    // 2. Type check indices in extended context (can reference parameters)
    const synthedIndices: C.Core[] = [];

    for (const index of this.indices) {
      const indexTypeResult = index.type.isType(currentCtx, rename);
      if (indexTypeResult instanceof stop) {
        return new stop(index.binder.location, new Message([`Index type is not a type: ${indexTypeResult.message}`]));
      }

      const indexTypeCore = (indexTypeResult as go<C.Core>).result;
      synthedIndices.push(indexTypeCore);

      // Extend context with this index for subsequent indices and constructors
      currentCtx = bindFree(currentCtx, index.binder.varName, valInContext(currentCtx, indexTypeCore));
    }

    // 3. Type check constructors in fully extended context
    let counter = 0;
    const synthedConstructors: C.Constructor[] = [];

    for (const ctor of this.constructors) {
      const result = this.typeCheckConstructor(currentCtx, rename, ctor, counter++);
      if (result instanceof stop) {
        return result;
      }
      synthedConstructors.push((result as go<C.Constructor>).result);
    }

    return new go(new DefineDatatypeCore(this.name, synthedParameters, synthedIndices, synthedConstructors));
  }

  private typeCheckConstructor(ctx: Context, rename: Renaming, ctor: ConstructorSpec, index: number): Perhaps<C.Constructor> {
    // Type check constructor arguments in sequence, extending context
    let currentCtx = ctx;
    const typecheckedArgs: C.Core[] = [];
    const coreRecArgs: C.Core[] = [];

    for (const arg of ctor.args) {
      const argTypeResult = arg.type.isType(currentCtx, rename);
      if (argTypeResult instanceof stop) {
        return new stop(arg.binder.location, new Message([`Constructor argument type is not a type: ${argTypeResult.message}`]));
      }

      const argTypeCore = (argTypeResult as go<C.Core>).result;
      typecheckedArgs.push(argTypeCore);

      // Check if this argument type refers to the datatype being defined (recursive)
      if (isRecursiveArgumentType(arg.type, this.name)) {
        coreRecArgs.push(argTypeCore);
      }

      // Extend context with this argument for subsequent arguments
      currentCtx = bindFree(currentCtx, arg.binder.varName, valInContext(currentCtx, argTypeCore));
    }

    return new go(new C.Constructor(ctor.name, this.name, typecheckedArgs, index, coreRecArgs));
  }
}

export class DefineDatatypeCore {
  constructor(
    public name: string,
    public parameters: C.Core[],
    public indices: C.Core[],
    public constructors: C.Constructor[]
  ) { }

  public valOf(env: Environment): V.InductiveType {
    return new V.InductiveType(
      this.name, 
      this.parameters.map(p => p.toLazy(env)), 
      this.indices.map(i => i.toLazy(env)), 
    )
  }
}

// Eliminator binder to store eliminator type information in context
export class EliminatorGenerator {
  constructor(
    public name: string,
    public datatypeName: string,
    public parameters: C.Core[],
    public indices: C.Core[],
    public constructors: C.Constructor[]
  ) {}

  public generateEliminatorType(ctx: Context): C.Core {
    // Following the algorithm: (Π [v : T A ... iv...] [P : (Π [i : τi]... (→ (T A ... i ...) Type))] [m ...]... (P iv... v))
    
    // 1. Target type: (T A ... iv...)
    let targetType: C.Core = new C.VarName(this.datatypeName);
    for (const param of this.parameters) {
      targetType = new C.Application(targetType, param);
    }
    for (const index of this.indices) {
      targetType = new C.Application(targetType, index);
    }

    // 2. Motive type: (Π [i : τi]... (→ (T A ... i ...) Type))
    let motiveType: C.Core = new C.Pi(
      fresh(ctx, "target"),
      targetType,
      new C.Universe()
    );

    // 3. Method types: one for each constructor
    const methodTypes = this.constructors.map(ctor => this.generateMethodType(ctx, ctor, motiveType));

    // 4. Build the full eliminator type
    let elimType: C.Core = motiveType; // Start with motive result type

    // Add methods from right to left
    for (let i = methodTypes.length - 1; i >= 0; i--) {
      elimType = new C.Pi(fresh(ctx, `method_${i}`), methodTypes[i], elimType);
    }

    // Add motive
    elimType = new C.Pi(fresh(ctx, "motive"), motiveType, elimType);

    // Add target
    elimType = new C.Pi(fresh(ctx, "target"), targetType, elimType);

    return elimType;
  }

  private generateMethodType(ctx: Context, ctor: C.Constructor, motiveType: C.Core): C.Core {
    // Following algorithm: (Π [i+x : τ1]... (→ (P ix... xrec)... (P τ2i... (C A... i+x...))))
    
    // Build constructor application: (C A... i+x...)
    let ctorApp: C.Core = new C.VarName(ctor.name);
    
    // Apply parameters and constructor args
    for (const param of this.parameters) {
      ctorApp = new C.Application(ctorApp, param);
    }

    let resultType: C.Core = new C.Application(motiveType, ctorApp);

    // Add inductive hypotheses for recursive arguments
    for (const recArg of ctor.recursive_args) {
      const ihType = new C.Application(motiveType, recArg);
      resultType = new C.Pi(fresh(ctx, "ih"), ihType, resultType);
    }

    // Add constructor arguments
    for (let i = ctor.args.length - 1; i >= 0; i--) {
      resultType = new C.Pi(fresh(ctx, `arg_${i}`), ctor.args[i], resultType);
    }

    return resultType;
  }
}

export function handleDefineDatatype(ctx: Context, renaming: Renaming, target: DefineDatatypeSource): Perhaps<Context> {
  if (ctx.has(target.name)) {
    return new stop(target.location, new Message([`Name already in use: ${target.name}`]));
  }

  // Create placeholder - for parameterized types, make it a function
  const placeholder = new InductiveDatatypePlaceholder(target.name);

  if (target.parameters.length > 0) {
    // For parameterized types like List, create: (E : U) -> U
    // Use HigherOrderClosure to avoid variable reference issues
    let resultType: V.Value = new V.Universe();

    for (let i = target.parameters.length - 1; i >= 0; i--) {
      const paramName = target.parameters[i].binder.varName;
      resultType = new V.Pi(
        paramName,
        new V.Universe(),
        new HigherOrderClosure((_arg: V.Value) => new V.Universe())
      );
    }

    placeholder.type = resultType;
  }

  let cur_ctx = extendContext(ctx, target.name, placeholder)

  const synthesized = target.typeSynth(cur_ctx, renaming)
  if (synthesized instanceof stop) {
    return synthesized
  }

  const core = (synthesized as go<DefineDatatypeCore>).result
  cur_ctx.delete(target.name)

  // 1. Add the datatype itself
  cur_ctx = extendContext(cur_ctx, core.name, new InductiveDatatypeBinder(core.name, core.valOf(contextToEnvironment(cur_ctx))))

  // 2. Add each constructor
  for (const ctor of core.constructors) {
    cur_ctx = extendContext(cur_ctx, ctor.name, new ConstructorBinder(ctor.name, ctor.valOf(contextToEnvironment(cur_ctx))))
  }

  // 3. Generate and add the eliminator
  const eliminatorName = target.eliminatorName || `elim${core.name}`;
  const eliminatorGenerator = new EliminatorGenerator(
    eliminatorName,
    core.name,
    core.parameters,
    core.indices,
    core.constructors
  );

  // Add eliminator to context
  const eliminatorType = eliminatorGenerator.generateEliminatorType(cur_ctx);
  cur_ctx = extendContext(cur_ctx, eliminatorName, new EliminatorBinder(eliminatorName, valInContext(cur_ctx, eliminatorType)));

  return new go(cur_ctx)
}

// Type synthesis for eliminator applications
export function synthEliminator(
  ctx: Context,
  renaming: Renaming, 
  location: Location,
  elimName: string,
  target: S.Source,
  motive: S.Source,
  methods: S.Source[]
): Perhaps<C.The> {
  
  const elimBinder = ctx.get(elimName);
  if (!elimBinder || !(elimBinder instanceof EliminatorGenerator)) {
    return new stop(location, new Message([`Unknown eliminator: ${elimName}`]));
  }

  // 1. Check target type: must be (T A ... iv...)
  const targetSynth = target.synth(ctx, renaming);
  if (targetSynth instanceof stop) return targetSynth;

  // 2. Check motive type: must be (Π [i : τi]... (→ (T A ... i ...) Type))
  const motiveSynth = motive.synth(ctx, renaming);
  if (motiveSynth instanceof stop) return motiveSynth;

  // 3. Check each method type against corresponding constructor
  if (methods.length !== elimBinder.constructors.length) {
    return new stop(location, new Message([
      `Eliminator expects ${elimBinder.constructors.length} methods, got ${methods.length}`
    ]));
  }

  for (let i = 0; i < methods.length; i++) {
    const methodSynth = methods[i].synth(ctx, renaming);
    if (methodSynth instanceof stop) return methodSynth;
    
    // TODO: Check method type matches expected type for constructor i
  }

  // Result type: (P iv... v) - motive applied to target
  const resultType = new C.Application(
    (motiveSynth as go<C.The>).result.type,
    (targetSynth as go<C.The>).result.expr
  );

  return new go(new C.The(
    resultType,
    new C.Eliminator(
      elimBinder.datatypeName,
      (targetSynth as go<C.The>).result.expr,
      (motiveSynth as go<C.The>).result.expr,
      methods.map(m => ((m.synth(ctx, renaming) as go<C.The>).result.expr))
    )
  ));
}

// Helper functions for creating inductive types with TypedBinder

export function makeTypedBinder(name: string, type: S.Source, location: Location): TypedBinder {
  return new TypedBinder(new SiteBinder(location, name), type);
}

export function makeConstructorSpec(name: string, args: TypedBinder[]): ConstructorSpec {
  return { name, args};
}

// Example factory functions for common inductive types

export function createListDatatype(location: Location): DefineDatatypeSource {
  const elemParam = makeTypedBinder("E", new S.Universe(location), location);

  return new DefineDatatypeSource(
    location,
    "List",
    [elemParam],           // Type parameters: ((E U))
    [],                    // No indices
    [
      makeConstructorSpec("nil", []),
      makeConstructorSpec("::", [
        makeTypedBinder("head", new S.Name(location, "E"), location),
        makeTypedBinder("tail", new S.Application(location, new S.Name(location, "List"), new S.Name(location, "E"), []), location)
      ])
    ],
    "ind-List"              // Eliminator name
  );
}

export function createVecDatatype(location: Location): DefineDatatypeSource {
  const elemParam = makeTypedBinder("E", new S.Universe(location), location);
  const lengthIndex = makeTypedBinder("n", new S.Nat(location), location);

  return new DefineDatatypeSource(
    location,
    "Vec",
    [elemParam],           // Type parameters: ((E U))
    [lengthIndex],         // Index parameters: ((n Nat))
    [
      makeConstructorSpec("vnil", [],
        // Explicit result type: (Vec E zero)
        new S.Application(location,
          new S.Application(location, new S.Name(location, "Vec"), new S.Name(location, "E"), []),
          new S.Zero(location), []
        )
      ),
      makeConstructorSpec("vcons", [
        makeTypedBinder("head", new S.Name(location, "E"), location),
        makeTypedBinder("tail",
          new S.Application(location,
            new S.Application(location, new S.Name(location, "Vec"), new S.Name(location, "E"), []),
            new S.Name(location, "n"), []
          ),
          location
        )
      ],
        // Explicit result type: (Vec E (add1 n))
        new S.Application(location,
          new S.Application(location, new S.Name(location, "Vec"), new S.Name(location, "E"), []),
          new S.Add1(location, new S.Name(location, "n")), []
        )
      )
    ],
    "ind-Vec"               // Eliminator name
  );
}

