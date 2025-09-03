import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { go, goOn, Perhaps, stop } from '../types/utils';
import { Context, extendContext, getInductiveType, InductiveDatatypePlaceholder, InductiveDatatypeBinder, ConstructorBinder, contextToEnvironment } from '../utils/context';
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
    let counter = 0
    const synthedConstructors = this.constructors.map(
      p => {
        let rec_args: S.InductiveTypeInfo[] = []
        counter += 1
        const typecheckedArgs = p.args.map(
          arg => {
            if (arg.type instanceof S.InductiveTypeInfo) {
              if (arg.type.name === this.name) {
                rec_args = [...rec_args, arg.type]
                return arg.type.isType(ctx, rename)
              }
//TODO: Probably this else is negligible, becuase we need to add check inductive type in isType 
              else {
                const inductiveTypeTemp = getInductiveType(ctx, arg.location, arg.type.name)
                if (inductiveTypeTemp instanceof stop) {
                  throw new Error(`No inductive type found for ${arg.type.name} at ${arg.location}`)
                }
                return new go((inductiveTypeTemp as go<InductiveDatatypeBinder>).result.type.readBackType(ctx))
              }
            } else {
              return arg.type.isType(ctx, rename)
            }
          }
        ).map(p => {
          if (p instanceof stop) {
            throw new Error(`Constructor argument type is not a type at ${p.where}`)
          }
          return (p as go<C.Core>).result
        })
        const coreRecArgs = rec_args.map(recArg => recArg.isType(ctx, rename))
                                   .map(p => {
                                     if (p instanceof stop) {
                                       throw new Error(`Recursive argument type is not a type at ${p.where}`)
                                     }
                                     return (p as go<C.Core>).result
                                   })
        return new C.Constructor(p.name, this.name, typecheckedArgs, counter, coreRecArgs)
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
)  }
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

  extendContext(ctx, core.name, new InductiveDatatypeBinder(core.name, core.valOf(contextToEnvironment(ctx))))

  for (const ctor of core.constructors) {
    extendContext(ctx, ctor.name, new ConstructorBinder(ctor.name, ctor.valOf(contextToEnvironment(ctx))))
  }

  return new go(ctx)
}