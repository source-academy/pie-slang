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
import { Position } from '../../scheme-parser/transpiler/types/location';

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

// Does `name` occur anywhere in `t`?
//
// Per spec this is `t.findNames().includes(name)`, but GeneralTypeConstructor's
// findNames() is not implemented (it throws), and a constructor's type-being-defined
// can appear as a GeneralTypeConstructor (e.g. an arrow domain `(Bad () ())`), so we
// handle that node directly here and defer to findNames() for everything else.
function occurs(t: S.Source, name: string): boolean {
  if (t instanceof S.GeneralTypeConstructor) {
    return t.name === name
      || t.params.some(p => occurs(p, name))
      || t.indices.some(i => occurs(i, name));
  }
  return t.findNames().includes(name);
}

// Does `name` appear to the left of an arrow inside `t`? Such an occurrence breaks
// strict positivity and makes the logic unsound.
function occursNegatively(t: S.Source, name: string): boolean {
  if (t instanceof S.Arrow) {
    // Curried arrow: arg1 -> arg2 -> ...args, where the last segment is the codomain.
    // Every preceding segment is a domain (left of an arrow). Note: arg2 is a domain
    // whenever args is non-empty, so we decompose over all segments rather than just
    // [arg1, ...args.slice(0,-1)], which would drop arg2 for multi-argument arrows.
    const segments = [t.arg1, t.arg2, ...t.args];
    const codomain = segments[segments.length - 1];
    const domains = segments.slice(0, -1);
    return domains.some(d => occurs(d, name)) || occursNegatively(codomain, name);
  }

  if (t instanceof S.Pi) {
    return t.binders.some(b => occurs(b.type, name)) || occursNegatively(t.body, name);
  }

  // Sigma / Pair components are not to the left of an arrow, so only a nested
  // negative occurrence inside them counts.
  if (t instanceof S.Sigma) {
    return t.binders.some(b => occursNegatively(b.type, name)) || occursNegatively(t.body, name);
  }

  if (t instanceof S.Pair) {
    return occursNegatively(t.first, name) || occursNegatively(t.second, name);
  }

  // The head being def.name at the top level is the GOOD recursive case (do not flag);
  // only a negative occurrence buried in a parameter or index is a violation.
  if (t instanceof S.GeneralTypeConstructor) {
    return t.params.some(p => occursNegatively(p, name))
      || t.indices.some(i => occursNegatively(i, name));
  }

  if (t instanceof S.Application) {
    return [t.func, t.arg, ...t.args].some(s => occursNegatively(s, name));
  }

  if (t instanceof S.List) {
    return occursNegatively(t.entryType, name);
  }

  if (t instanceof S.Vec) {
    return occursNegatively(t.type, name) || occursNegatively(t.length, name);
  }

  if (t instanceof S.Either) {
    return occursNegatively(t.left, name) || occursNegatively(t.right, name);
  }

  if (t instanceof S.Equal) {
    return occursNegatively(t.type, name)
      || occursNegatively(t.left, name)
      || occursNegatively(t.right, name);
  }

  // S.Name and atomic leaves: no arrow, so no negative occurrence.
  return false;
}

// Reject non-strictly-positive datatype declarations: a constructor argument whose
// type mentions the type being defined to the left of an arrow lets one prove Absurd.
// Returns the offending constructor/argument names, or null if the definition is sound.
function checkStrictPositivity(def: TypeDefinition): { ctor: string; arg: string } | null {
  for (const ctor of def.constructors) {
    for (const arg of ctor.args) {
      if (occursNegatively(arg.type, def.name)) {
        return { ctor: ctor.name, arg: arg.binder.varName };
      }
    }
  }
  return null;
}

export class TypeDefinition {
  constructor(
    public location: Location,
    public name: string,
    public parameters: TypedBinder[],
    public indices: TypedBinder[],
    public constructors: GeneralConstructor[],
    public eliminatorName?: string
  ) { }

  normalizeConstructor(ctx: Context, rename: Renaming) {
    // Reject non-strictly-positive definitions before anything is added to context.
    const violation = checkStrictPositivity(this);
    if (violation !== null) {
      const { ctor: ctorName, arg: argName } = violation;
      const s = new stop(this.location, new Message([
        `Non strictly positive occurrence of '${this.name}' in argument '${argName}' of constructor '${ctorName}': the type being defined may not occur to the left of an arrow.`]));
      throw new Error(s.message.toString());
    }

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
          validValueType,
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
    const argNames: string[] = []
    const rec_argNames: string[] = []

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
        rec_argNames.push(xhat)
      } else {
        normalized_args.push(result)
        argNames.push(xhat)
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
      returnResult as C.InductiveTypeConstructor,
      argNames,
      rec_argNames
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
export function handleTypeDefinition(ctx: Context, rename: Renaming, target: TypeDefinition): Perhaps<Context> {
  if (ctx.has(target.name)) {
    return new stop(target.location, new Message([`Name already in use: ${target.name}`]));
  }

  const [new_ctx, ] = target.normalizeConstructor(ctx, rename);
  return new go<Context>(new_ctx);
}
