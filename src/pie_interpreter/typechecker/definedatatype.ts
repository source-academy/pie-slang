import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { go, goOn, Perhaps, stop, fresh, TypedBinder, Message } from '../types/utils';
import { Context, extendContext, getInductiveType, InductiveDatatypePlaceholder, InductiveDatatypeBinder, ConstructorBinder, contextToEnvironment, EliminatorBinder, valInContext } from '../utils/context';
import { Location } from '../utils/locations';
import { rename, Renaming } from './utils';
import { Constructor } from '../types/value';
import { Environment } from '../utils/environment';

export class DefineDatatypeSource {
  constructor(
    public location: Location,
    public name: string,
    public parameters: S.The[],
    public indices: S.The[],
    public constructors: { name: string, args: S.The[] }[],
    public typeValue: V.Value
  ) { }

  public toString(): string {
    return `data ${this.name} ${this.parameters.map(p => p.toString()).join(' ')} where ${this.constructors.map(c => c.name + ' ' + c.args.map(a => a.toString()).join(' ')).join(', ')}`;
  }

  public typeSynth(ctx: Context, rename: Renaming): Perhaps<DefineDatatypeCore> {
    const synthedParameters = this.parameters.map(p => p.type.isType(ctx, rename))
                                             .map(p => {
                                              if (p instanceof stop) {
                                                throw new Error(`Parameter type is not a type at ${p.where}`)
                                              }
                                              return (p as go<C.Core>).result
                                            })
    const synthedIndices = this.indices.map(p => p.type.isType(ctx, rename))
                                         .map(p => {
                                              if (p instanceof stop) {
                                                throw new Error(`Index type is not a type at ${p.where}`)
                                              }
                                              return (p as go<C.Core>).result
                                            })
    
    let counter = 0;
    const synthedConstructors = this.constructors.map(
      p => {
        const typecheckedArgs = p.args.map(arg => arg.isType(ctx, rename))
                                       .map(arg => {
                                         if (arg instanceof stop) {
                                           throw new Error(`Constructor argument type is not a type at ${arg.where}`)
                                         }
                                         return (arg as go<C.Core>).result
                                       })
        
        // Find recursive arguments (those with type T)
        const coreRecArgs = p.args.filter(arg => 
          arg.prettyPrint().includes(this.name)
        ).map(arg => arg.isType(ctx, rename))
         .map(arg => {
                                     if (arg instanceof stop) {
                                       throw new Error(`Recursive argument type is not a type at ${arg.where}`)
                                     }
                                     return (arg as go<C.Core>).result
                                   })
        return new C.Constructor(p.name, this.name, typecheckedArgs, counter++, coreRecArgs)
      }
    )
    return new go(new DefineDatatypeCore(this.name, synthedParameters, synthedIndices, synthedConstructors))
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
  const placeholder = new InductiveDatatypePlaceholder(target.name)
  if (ctx.has(target.name)) {
    throw new Error(`this name is already in use ${target.name}`)
  }
  extendContext(ctx, target.name, placeholder)
  
  const synthesized = target.typeSynth(ctx, renaming)
  if (synthesized instanceof stop) {
    return synthesized
  }

  const core = (synthesized as go<DefineDatatypeCore>).result
  ctx.delete(target.name)

  // 1. Add the datatype itself
  extendContext(ctx, core.name, new InductiveDatatypeBinder(core.name, core.valOf(contextToEnvironment(ctx))))

  // 2. Add each constructor  
  for (const ctor of core.constructors) {
    extendContext(ctx, ctor.name, new ConstructorBinder(ctor.name, ctor.valOf(contextToEnvironment(ctx))))
  }

  // 3. Generate and add the eliminator (following the algorithm)
  const eliminatorName = `elim${core.name}`;
  const eliminatorGenerator = new EliminatorGenerator(
    eliminatorName,
    core.name,
    core.parameters, 
    core.indices,
    core.constructors
  );

  // Add eliminator to context
  extendContext(ctx, eliminatorName, new EliminatorBinder(eliminatorName, valInContext(ctx, eliminatorGenerator.generateEliminatorType(ctx))));

  return new go(ctx)
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
  
  // Get eliminator from context
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
      methods.map((m, i) => ((m.synth(ctx, renaming) as go<C.The>).result.expr))
    )
  ));
}