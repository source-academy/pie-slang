import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { go, Perhaps, stop, fresh, TypedBinder, Message, SiteBinder, HigherOrderClosure } from '../types/utils';
import { Context, extendContext, InductiveDatatypeBinder, ConstructorTypeBinder, contextToEnvironment, EliminatorBinder, valInContext, bindFree, getClaim } from '../utils/context';
import { Location, Syntax } from '../utils/locations';
import { extendRenaming, Renaming } from './utils';
import { Environment } from '../utils/environment';
import { VarName } from '../types/core';
import { synthesizer } from './synthesizer';
import { doApp } from '../evaluator/evaluator';
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

  normalize_constructor(ctx: Context, rename: Renaming) {
    // Build the type: if there are parameters, wrap in Pi, otherwise just use indices
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

    let normalized_constructor: C.ConstructorType[] = []
    for (let i = 0; i < this.constructors.length; i++) {
      // For types with no parameters, validValueType will be Universe, not Pi
      // We need to pass the appropriate target type to checkValid
      normalized_constructor.push(this.constructors[i].checkValid(extendedCtx, extendedRename, validValueType as any, i))
    }
    
    let ret_ctx = ctx
    let ret_rename = rename
    ret_ctx = extendContext(ret_ctx, this.name,
      new InductiveDatatypeBinder(this.name, validValueType as V.InductiveType))
    normalized_constructor.forEach(element => {
      const fresh_name = fresh(ret_ctx, element.name)
      // Get the InductiveTypeConstructor from the constructor's result type
      // For parameterized types, this will contain VarNames - that's OK, it's symbolic
      let resultTypeValue: V.InductiveTypeConstructor

      if (element.numTypeParams > 0) {
        // For parameterized constructors, evaluate in the extended context where parameters were bound
        resultTypeValue = valInContext(extendedCtx, element.resultType) as V.InductiveTypeConstructor
      } else {
        // For simple constructors, evaluate in base context
        resultTypeValue = valInContext(ctx, element.resultType) as V.InductiveTypeConstructor
      }

      ret_ctx = extendContext(ret_ctx, fresh_name, new ConstructorTypeBinder(fresh_name, element, resultTypeValue))
      ret_rename = extendRenaming(ret_rename, element.name, fresh_name)
    })
    return [ret_ctx, ret_rename] as [Context, Renaming]
  }

  /**
   * Generate the motive type for the eliminator of this inductive type.
   *
   * The motive type has the form:
   * (Π [i₁ : τ₁] ... [iₙ : τₙ] [target : T params... i₁...iₙ] U)
   *
   * Where:
   * - i₁...iₙ are the indices of the inductive type
   * - T is the inductive type name
   * - params are the type parameters
   * - target is the value being eliminated
   *
   * Examples:
   * - Nat (no indices): (Π [n : Nat] U)
   * - Vec E (one index k : Nat): (Π [k : Nat] [es : Vec E k] U)
   * - Fin (one index n : Nat): (Π [n : Nat] [f : Fin n] U)
   *
   * IMPORTANT: Index variables must be captured inside closures and used to
   * construct the target type, following the pattern from synthIndVec.
   */
  //TODO: add telescope to this if needed
  // generateMotiveType(ctx: Context, rename: Renaming, params: V.Value[]): V.Value {
  //   // Step 1: Extract index types from the Pi structure
  //   let indexTypes: Array<[string, V.Value]> = [];
  //   let cur: S.Source = this.indices;

  //   while (cur instanceof S.Pi && cur.binders.length > 0) {
  //     const binder = cur.binders[0];
  //     const typeCore = binder.type.check(ctx, rename, new V.Universe());
  //     if (typeCore instanceof stop) {
  //       throw new Error(typeCore.message.toString());
  //     }
  //     const indexType = (typeCore as go<C.Core>).result;
  //     indexTypes.push([binder.binder.varName, valInContext(ctx, indexType)]);
  //     cur = cur.body as S.Source;
  //   }

  //   // Step 2: Build nested Pi structure recursively
  //   // Each closure captures index values at runtime
  //   const buildMotive = (level: number, capturedIndices: V.Value[]): V.Value => {
  //     if (level >= indexTypes.length) {
  //       // Base case: build (Π [target : InductiveType(name, params, capturedIndices)] U)
  //       return new V.Pi(
  //         'target',
  //         new V.InductiveTypeConstructor(this.name, params, capturedIndices),
  //         new HigherOrderClosure(_ => new V.Universe())
  //       );
  //     }

  //     // Recursive case: build (Π [index : τ] ...)
  //     const [indexName, indexType] = indexTypes[level];
  //     return new V.Pi(
  //       indexName,
  //       indexType,
  //       new HigherOrderClosure(indexVal =>
  //         buildMotive(level + 1, [...capturedIndices, indexVal])
  //       )
  //     );
  //   };

  //   return buildMotive(0, []);
  // }

  /**
   * Generate the eliminator method type for a specific constructor.
   *
   * Method type: (Π [i+x : τ₁]... (→ (P ix... xrec)... (P τ₂i... (C A... i+x...))))
   *
   * Following the Turnstile+ pattern:
   * - Bind all constructor arguments
   * - Add inductive hypotheses for recursive arguments
   * - Result: motive applied to constructor application
   */
  generateMethodType(
    ctx: Context,
    rename: Renaming,
    ctorType: C.ConstructorType,
    motiveValue: V.Value,
    params: V.Value[]
  ): V.Value {
    // Build environment with type parameters bound for evaluating argTypes
    let argEnv = new Map(contextToEnvironment(ctx));

    // Extract all VarNames from argTypes and rec_argTypes
    const varNames = new Set<string>();
    [...ctorType.argTypes, ...ctorType.rec_argTypes].forEach(at => {
      if (at instanceof C.VarName) {
        varNames.add(at.name);
      }
    });

    // Bind each unique VarName to the corresponding type parameter
    const varNameArray = Array.from(varNames);
    for (let i = 0; i < varNameArray.length && i < params.length; i++) {
      argEnv.set(varNameArray[i], params[i]);
    }

    // Get all argument types (non-recursive + recursive)
    const allArgTypes = [
      ...ctorType.argTypes.map(t => t.valOf(argEnv)),
      ...ctorType.rec_argTypes.map(t => t.valOf(argEnv))
    ];

    // Build method type recursively with nested closures
    const buildMethod = (level: number, capturedArgs: V.Value[]): V.Value => {
      if (level >= allArgTypes.length) {
        // All arguments captured, now add inductive hypotheses and result

        // Step 1: Add IHs for recursive arguments (in reverse order)
        let result: V.Value;

        // First, build the result type: P applied to constructor
        const ctorApp = new V.Constructor(
          ctorType.name,
          ctorType.type,
          capturedArgs,
          ctorType.index,
          []  // Will be filled with recursive args
        );

        // Extract result indices from ctorType.resultType
        const resultType = valInContext(ctx, ctorType.resultType);
        const resultIndices = extractIndicesFromValue(resultType);

        // Apply motive to indices and constructor
        result = motiveValue;
        for (const idx of resultIndices) {
          result = doApp(result, idx);
        }
        result = doApp(result, ctorApp);

        // Step 2: Wrap with inductive hypotheses (for recursive args, in reverse)
        const numNonRec = ctorType.argTypes.length;
        for (let i = ctorType.rec_argTypes.length - 1; i >= 0; i--) {
          const recArgIndex = numNonRec + i;
          const recArg = capturedArgs[recArgIndex];
          const recArgTypeValue = allArgTypes[recArgIndex];

          // Build IH type: P(indices... recArg)
          // The recursive arg type (e.g., Vec E k) when evaluated in context
          // has its indices as Values that reference captured arguments
          let ihType = motiveValue;
          if (recArgTypeValue instanceof V.InductiveTypeConstructor) {
            for (const idx of recArgTypeValue.indices) {
              ihType = doApp(ihType, idx);
            }
          }
          ihType = doApp(ihType, recArg);

          const currentResult = result;
          result = new V.Pi(
            `ih${i}`,
            ihType,
            new HigherOrderClosure(_ => currentResult)
          );
        }

        return result;
      }

      // Recursive case: bind constructor argument
      const argType = allArgTypes[level];
      return new V.Pi(
        `arg${level}`,
        argType,
        new HigherOrderClosure(argVal =>
          buildMethod(level + 1, [...capturedArgs, argVal])
        )
      );
    };

    return buildMethod(0, []);
  }

}

// Helper function to extract indices from a value
function extractIndicesFromValue(val: V.Value): V.Value[] {
  if (val instanceof V.InductiveTypeConstructor) {
    return val.indices;
  }
  return [];
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
    let normalized_args = []
    let normalized_rec_args = []
    let numTypeParams = 0
    let argNames: string[] = []

    for (let i = 0; i < this.args.length; i++) {
      const argName = this.args[i].binder.varName
      const xhat = fresh(cur_ctx, argName)

      // Store the original argument name
      argNames.push(argName)

      // Get the Core representation of the type annotation
      const resultTemp = this.args[i].type.isType(cur_ctx, cur_rename)
      if (resultTemp instanceof stop) {
        throw new Error(resultTemp.message.toString())
      }
      const result = (resultTemp as go<C.Core>).result

      // Check if this argument IS a type parameter (annotation is Universe at SOURCE level)
      if (this.args[i].type instanceof S.Universe) {
        numTypeParams++
      }

      if (isRecursiveArgumentType(this.args[i].type,this.returnType.name)) {
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
        returnResult,
        numTypeParams,
        argNames
      )


  }
}

export class GeneralTypeSource {
  constructor(
    public location: Location,
    public name: string,
    public parameters: TypedBinder[],
    public indices: TypedBinder[]
  ){ }
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
  let [new_ctx, new_rename] = target.normalize_constructor(ctx, rename)

  
}

