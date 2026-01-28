import * as V from "../types/value";
import * as C from '../types/core';
import * as N from '../types/neutral';
import { fresh, extractVarNamesFromValue } from '../types/utils';
import { bindFree, Context, ConstructorTypeBinder, valInContext, contextToEnvironment } from '../utils/context';
import { extendEnvironment } from '../utils/environment';
import { doApp, doCar, doCdr } from "./evaluator";

/**
 *   ## Call-by-need evaluation ##

  Pie is a total language, which means that every program will
  eventually terminate. Because the steps taken during evaluation are
  completely deterministic, and because Pie is total, it is
  acceptable to choose any order of evaluation.

  On the other hand, many useful Pie programs will take many more
  evaluation steps to complete when using strict evaluation. For
  instance, consider zerop from chapter 3 of The Little Typer. zerop
  returns 'nil when its argument's value has V_Add1 at the top, or 't
  if it is zero. If (zerop (double 10000)) is evaluated strictly, the
  evaluator will first need to find out that (double 10000) is 20000,
  requiring 10000 steps.  On the other hand, if it is evaluated
  lazily, then it will need only one step to discover that the value
  has V_Add1 at the top.

  Pie uses call-by-need evaluation. This means that if two different
  expressions make use of some expression, such as a definition, then
  evaluation steps will be shared between them and will not need to
  be repeated.

  Call-by-need evaluation is achieved by introducing a new value that
  represents evaluation that has not yet been performed, but should
  instead be performed on demand. That value, which doesn't represent
  any value in the Pie sense of the word, is called DELAY and is
  defined in basics.rkt. When DELAY represents work that has not yet
  been done, it is filled with a special kind of closure called
  DELAY-CLOS that pairs an expression with its environment.

  Not every DELAY represents evaluation that has not yet been
  performed. Some represent evaluation that was already demanded by
  some other operator. The work is shared by updating the contents of
  DELAY with an actual value.

  later is used to delay evaluation by constructing a DELAY value
  that contains a DELAY-CLOS closure.
*/

// undelay is used to find the value that is contained in a
// DELAY-CLOS closure by invoking the evaluator.
/* export function undelay(c: V.DelayClosure): V.Value {
  return now(c.expr.valOf(c.env));
} */

/*
  now demands the _actual_ value represented by a DELAY. If the value
  is a DELAY-CLOS, then it is computed using undelay. If it is
  anything else, then it has already been computed, so it is
  returned.
  
  now should be used any time that a value is inspected to see what
  form it has, because those situations require that the delayed
  evaluation steps be carried out.
*/
/* export function now(todo: V.Value): V.Value {
  if (todo instanceof V.Delay) { //todo.val is nessarily a Box
    const box = todo.val;
    const content = box.get();
    if (content instanceof V.DelayClosure) {
      let theValue = undelay(content);
      box.set(theValue);
      return theValue;
    } else { // content is a Value (content instanceof Value).
      return box.get() as V.Value;
    }
  }
  return todo;
} */

export function natEqual(nat1: V.Value, nat2: V.Value): boolean {
  const nat1Now = nat1.now();
  const nat2Now = nat2.now();
  if (nat1Now instanceof V.Zero && nat2Now instanceof V.Zero) {
    return true;
  } else if (nat1Now instanceof V.Add1 && nat2Now instanceof V.Add1) {
    return natEqual(nat1Now.smaller, nat2Now.smaller);
  } else {
    return false;
  }
}

export function readBack(context: Context, type: V.Value, value: V.Value): C.Core {
  const typeNow = type.now();
  const valueNow = value.now();

  if (typeNow instanceof V.Universe) {
    return value.readBackType(context);
  } else if (typeNow instanceof V.Nat
    && valueNow instanceof V.Zero) {
    return new C.Zero();
  } else if (typeNow instanceof V.Nat
    && valueNow instanceof V.Add1) {
    return new C.Add1(
      readBack(context, new V.Nat(), valueNow.smaller)
    );
  } else if (typeNow instanceof V.Pi) {
    const y = valueNow instanceof V.Lambda ?
      valueNow.argName : typeNow.argName;
    const freshx = fresh(context, y);
    return new C.Lambda(freshx, readBack(
      bindFree(context, freshx, typeNow.argType),
      typeNow.resultType.valOfClosure(
        new V.Neutral(typeNow.argType, new N.Variable(freshx))
      ),
      doApp(
        valueNow,
        new V.Neutral(typeNow.argType, new N.Variable(freshx))
      )
    ));
  } else if (typeNow instanceof V.Sigma) {
    const car = doCar(value);
    const cdr = doCdr(value);
    return new C.Cons(
      readBack(context, typeNow.carType, car),
      readBack(
        context,
        typeNow.cdrType.valOfClosure(car),
        cdr
      )
    );
  } else if (typeNow instanceof V.Atom
    && valueNow instanceof V.Quote) {
    return new C.Quote(valueNow.name);
  } else if (typeNow instanceof V.Trivial) {
    return new C.Sole();
  } else if (typeNow instanceof V.List
    && valueNow instanceof V.Nil) {
    return new C.Nil();
  } else if (typeNow instanceof V.List
    && valueNow instanceof V.ListCons) {
    return new C.Cons(
      readBack(context, typeNow.entryType, valueNow.head),
      readBack(context, new V.List(typeNow.entryType), valueNow.tail));
  } else if (typeNow instanceof V.Absurd
    && valueNow instanceof V.Neutral) {
    return new C.The(
      new C.Absurd(),
      valueNow.neutral.readBackNeutral(context)
    );
  } else if (typeNow instanceof V.Equal
    && valueNow instanceof V.Same) {
    return new C.Same(
      readBack(context, typeNow.type, valueNow.value));
  } else if (typeNow instanceof V.Vec
    && typeNow.length.now() instanceof V.Zero
    && valueNow instanceof V.VecNil) {
    return new C.VecNil();
  } else if (typeNow instanceof V.Vec
    && typeNow.length.now() instanceof V.Add1
    && valueNow instanceof V.VecCons) {
    const lenNow = typeNow.length.now() as V.Add1;
    return new C.VecCons(
      readBack(context, typeNow.entryType, valueNow.head),
      readBack(
        context,
        new V.Vec(typeNow.entryType, (typeNow.length.now() as V.Add1).smaller),
        valueNow.tail
      )
    );
  } else if (typeNow instanceof V.Either
    && valueNow instanceof V.Left) {
    return new C.Left(
      readBack(context, typeNow.leftType, valueNow.value)
    );
  } else if (typeNow instanceof V.Either
    && valueNow instanceof V.Right) {
    return new C.Right(
      readBack(context, typeNow.rightType, valueNow.value)!
    );
  } else if (typeNow instanceof V.InductiveTypeConstructor
    && valueNow instanceof V.Constructor) {
    // Read back constructor applications
    // Need to substitute concrete parameters from expected type into constructor arg types
    let ctorBinder: ConstructorTypeBinder | undefined;
    for (const [name, binder] of context) {
      if (name === valueNow.name && binder instanceof ConstructorTypeBinder) {
        ctorBinder = binder;
        break;
      }
    }

    if (!ctorBinder) {
      throw new Error(`Constructor ${valueNow.name} not found in context`);
    }

    // Get constructor type (Core) - contains abstract parameters like VarName("E")
    const ctorTypeCore = ctorBinder.constructorType;
    const resultTypeCore = ctorTypeCore.resultType as C.InductiveTypeConstructor;

    // Build substitution environment: parameter names -> concrete values
    // Same pattern as ConstructorApplication.checkOut
    let substEnv = contextToEnvironment(context);

    // Extract parameter names from constructor's return type and map to concrete values
    for (let i = 0; i < resultTypeCore.parameters.length; i++) {
      const paramCore = resultTypeCore.parameters[i];
      if (paramCore instanceof C.VarName) {
        const paramName = paramCore.name;
        const concreteValue = typeNow.parameters[i].now();
        // Override abstract binding (E -> Neutral) with concrete (E -> Nat)
        substEnv = extendEnvironment(substEnv, paramName, concreteValue);
      }
    }

    // Similarly for indices
    for (let i = 0; i < resultTypeCore.indices.length; i++) {
      const indexCore = resultTypeCore.indices[i];
      if (indexCore instanceof C.VarName) {
        const indexName = indexCore.name;
        const concreteValue = typeNow.indices[i].now();
        substEnv = extendEnvironment(substEnv, indexName, concreteValue);
      }
    }

    // Extract constructor argument names from the return type Value (indices only!)
    // We only need to track INDEX arguments for incremental substitution, not parameters
    const returnTypeValue = ctorBinder.type; // V.InductiveTypeConstructor
    const indexArgNames: string[] = [];
    returnTypeValue.indices.forEach(i => {
      indexArgNames.push(...extractVarNamesFromValue(i));
    });

    // Read back arguments with incremental substitution
    const readBackArgs: C.Core[] = [];
    for (let i = 0; i < valueNow.args.length; i++) {
      const argTypeCore = ctorTypeCore.argTypes[i];
      const argTypeValue = argTypeCore.valOf(substEnv);
      const readBackArg = readBack(context, argTypeValue.now(), valueNow.args[i]);
      readBackArgs.push(readBackArg);

      // Extend substEnv with this argument's value for subsequent arguments
      if (i < indexArgNames.length) {
        const argName = indexArgNames[i];
        const argValue = valueNow.args[i].now();
        substEnv = extendEnvironment(substEnv, argName, argValue);
      }
    }

    // Read back recursive arguments with incremental substitution
    const readBackRecArgs: C.Core[] = [];
    const recArgStartIdx = valueNow.args.length;
    for (let i = 0; i < valueNow.recursive_args.length; i++) {
      const recArgTypeCore = ctorTypeCore.rec_argTypes[i];
      const recArgTypeValue = recArgTypeCore.valOf(substEnv);
      const readBackRecArg = readBack(context, recArgTypeValue.now(), valueNow.recursive_args[i]);
      readBackRecArgs.push(readBackRecArg);

      // Extend substEnv with this recursive argument's value
      const argNameIdx = recArgStartIdx + i;
      if (argNameIdx < indexArgNames.length) {
        const argName = indexArgNames[argNameIdx];
        const recArgValue = valueNow.recursive_args[i].now();
        substEnv = extendEnvironment(substEnv, argName, recArgValue);
      }
    }

    return new C.Constructor(
      valueNow.name,
      valueNow.index,
      valueNow.type,
      readBackArgs,
      readBackRecArgs
    );
  } else if (valueNow instanceof V.Neutral) {
    return valueNow.neutral.readBackNeutral(context);
  }

  throw new Error(`Cannot read back ${valueNow.prettyPrint()} : ${typeNow.prettyPrint()}`);
}
