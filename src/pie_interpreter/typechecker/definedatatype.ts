import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { go, Perhaps, stop, fresh, TypedBinder, Message } from '../types/utils';
import { 
  Context, 
  extendContext, 
  InductiveDatatypeBinder, 
  ConstructorTypeBinder, 
  valInContext, 
  bindFree 
} from '../utils/context';
import { Location, Syntax } from '../utils/locations';
import { extendRenaming, Renaming } from './utils';
import { Position } from '../../scheme_parser/transpiler/types/location';

function isRecursiveArgumentType(argType: S.Source, datatypeName: string): boolean {
  if (argType instanceof S.Name && argType.name === datatypeName) {
    return true;
  }

  if (argType instanceof S.GeneralTypeConstructor &&
    argType.name === datatypeName) {
    return true;
  }

  return false;
}

export class DefineDatatypeSource {
  constructor(
    public location: Location,
    public name: string,
    public parameters: TypedBinder[],
    public indices: TypedBinder[],
    public constructors: GeneralConstructor[],
    public eliminatorName?: string
  ) { }

  normalizeConstructor(ctx: Context, rename: Renaming) {
    const validTypeTemp = (new S.GeneralType
      (this.location,
        this.name,
        this.parameters,
        this.indices
      ).isType(ctx, rename)
    )
    if (validTypeTemp instanceof stop) {
      throw new Error(validTypeTemp.message.toString())
    }
    const validType = (validTypeTemp as go<C.Core>).result

    // Extend context with parameters so constructors can reference them
    let extendedCtx = ctx;
    let extendedRename = rename;
    for (const param of this.parameters) {
      const paramName = param.binder.varName;
      const paramTypeResult = param.type.isType(extendedCtx, extendedRename);
      if (paramTypeResult instanceof stop) {
        throw new Error(paramTypeResult.message.toString());
      }
      const paramTypeCore = (paramTypeResult as go<C.Core>).result;
      const paramNameHat = fresh(extendedCtx, paramName);
      extendedCtx = bindFree(extendedCtx, paramNameHat, valInContext(extendedCtx, paramTypeCore));
      extendedRename = extendRenaming(extendedRename, paramName, paramNameHat);
    }

    // Evaluate the type in the extended context so parameters are bound
    const validValueType = valInContext(extendedCtx, validType);

    // Add the inductive type itself to the context so recursive constructors can reference it
    extendedCtx = extendContext(extendedCtx, this.name,
      new InductiveDatatypeBinder(this.name, validValueType as V.InductiveType))

    const normalized_constructor: C.ConstructorType[] = []
    for (let i = 0; i < this.constructors.length; i++) {
      normalized_constructor.push(
        this.constructors[i].checkValid(
          extendedCtx,
          extendedRename,
          validValueType as any,
          i
        )
      )
    }

    // Build return context: start from original, add datatype and constructors
    // Do NOT include parameter bindings in return context - they're only for internal checking
    let ret_ctx = ctx;
    let ret_rename = rename;

    ret_ctx = extendContext(ret_ctx, this.name,
      new InductiveDatatypeBinder(this.name, validValueType as V.InductiveType))
    normalized_constructor.forEach(element => {
      const fresh_name = fresh(ret_ctx, element.name)
      const resultTypeValue = valInContext(extendedCtx, element.resultType) as V.InductiveTypeConstructor

      ret_ctx = extendContext(ret_ctx, fresh_name, new ConstructorTypeBinder(fresh_name, element, resultTypeValue))
      ret_rename = extendRenaming(ret_rename, element.name, fresh_name)
    })
    return [ret_ctx, ret_rename] as [Context, Renaming]
  }
}

export class GeneralConstructor {
  constructor(
    public location: Location,
    public name: string,
    public args: TypedBinder[],
    public returnType: S.GeneralTypeConstructor
  ) { }

  checkValid(ctx: Context, rename: Renaming, target: V.Value, index: number) {
    let cur_ctx = ctx
    let cur_rename = rename
    const normalized_args: C.Core[] = []
    const normalized_rec_args: C.Core[] = []

    for (let i = 0; i < this.args.length; i++) {
      const argName = this.args[i].binder.varName
      const xhat = fresh(cur_ctx, argName)

      // Get the Core representation of the type annotation
      const resultTemp = this.args[i].type.isType(cur_ctx, cur_rename)
      if (resultTemp instanceof stop) {
        throw new Error(resultTemp.message.toString())
      }
      const result = (resultTemp as go<C.Core>).result

      // Assume user puts non-recursive args before recursive args
      if (isRecursiveArgumentType(this.args[i].type, this.returnType.name)) {
        normalized_rec_args.push(result)
      } else {
        normalized_args.push(result)
      }

      cur_ctx = bindFree(cur_ctx, xhat, valInContext(cur_ctx, result))
      cur_rename = extendRenaming(cur_rename, argName, xhat)
    }

    const returnTemp = this.returnType.check(cur_ctx, cur_rename, target)
    if (returnTemp instanceof stop) {
      throw new Error(returnTemp.message.toString())
    }
    const returnResult = (returnTemp as go<C.Core>).result
    return new C.ConstructorType(
      this.name,
      index,
      this.returnType.name,
      normalized_args,
      normalized_rec_args,
      returnResult
    )
  }
}

// Helper function to create constructor spec
export function makeConstructorSpec(name: string, args: TypedBinder[]): GeneralConstructor {
  return new GeneralConstructor(
    args.length > 0 ? args[0].binder.location : new Location(new Syntax(new Position(0, 0), new Position(0, 0), 'generated'), false),
    name,
    args,
    new S.GeneralTypeConstructor(
      args.length > 0 ? args[0].binder.location : new Location(new Syntax(new Position(0, 0), new Position(0, 0), 'generated'), false),
      '',  // Will be set by caller
      [],
      []
    )
  );
}

// Main function to handle datatype definition and add to context
export function handleDefineDatatype(ctx: Context, rename: Renaming, target: DefineDatatypeSource): Perhaps<Context> {
  if (ctx.has(target.name)) {
    return new stop(target.location, new Message([`Name already in use: ${target.name}`]));
  }

  const [new_ctx, new_rename] = target.normalizeConstructor(ctx, rename);
  return new go<Context>(new_ctx);
}
