import { Context, Claim, Free, Define } from './contexts';
import { Value, Neutral} from './value';
import { Variable } from './neutral';

/*  
    ## Run-time Environments ##

    Run-time environments
    A run-time environment associates a value with each variable.
*/

export class Environment {
  constructor(
    public bindings: Map<string, Value>
  ) { }

  public extendEnvironment(name: string, value: Value): Environment {
    return new Environment(
      new Map([...this.bindings, [name, value]])
    );
  }

  // Lookup the value of a variable in an environment (var-val)
  public getValueFromEnvironment(name: string): Value {
    if (this.bindings.has(name)) {
      // As we are sure that the variable is in the environment,
      // we can use the non-nullable assertion operator (!)
      return this.bindings.get(name)!;
    } else {
      throw new Error(`Variable ${name} not found in environment`);
    }
  }

  // To find the value of a variable in an environment
  public ValueOfVar(name: string): Value {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)!;
    } else {
      throw new Error(`Variable ${name} not in env: ${JSON.stringify(this)}`);
    }
  }
}

// // export function extendEnvironment(
// //     env: Environment, name: string, value: Value
// // ): Environment {
// //   return new Environment(
// //     new Map([...env.bindings, [name, value]])
// //   );
// // }

// // Lookup the value of a variable in an environment (var-val)
// export function getValueFromEnvironment(env: Environment, name: string): Value {
//   if (env.bindings.has(name)) {
//     // As we are sure that the variable is in the environment,
//     // we can use the non-nullable assertion operator (!)
//     return env.bindings.get(name)!;
//   } else {
//     throw new Error(`Variable ${name} not found in environment`);
//   }
// }

// // export function contextToEnvironment(context: Context): Environment {
// //   if (context.context.size === 0) {
// //     return new Environment(new Map());
// //   }
// //   const bindings = context.context.entries();
// //   const environment = new Map();
// //   for (const [name, binder] of bindings) {
// //     if (binder instanceof Define) {
// //       environment.set(name, binder.value);
// //     } else if (binder instanceof Free) {
// //       environment.set(name, new Neutral(binder.type, new Variable(name)));
// //     } // else continue;
// //   }
// //   return new Environment(environment);
// // }

// // To find the value of a variable in an environment
// export function ValueOfVar(env: Environment, name: string): Value {
//   if (env.bindings.has(name)) {
//     return env.bindings.get(name)!;
//   } else {
//     throw new Error(`Variable ${name} not in env: ${JSON.stringify(env)}`);
//   }
// }
