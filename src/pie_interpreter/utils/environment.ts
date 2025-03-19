import { Value } from '../types/value';

/*  
    ## Run-time Environments ##

    Run-time environments
    A run-time environment associates a value with each variable.
*/

export type Environment = Map<string, Value>;
  export function extendEnvironment(env: Environment, name: string, value: Value): Environment {
    return new Map([...env, [name, value]]);
  }

  // Lookup the value of a variable in an environment (var-val)
  export function getValueFromEnvironment(env: Environment, name: string): Value {
    if (env.has(name)) {
      // As we are sure that the variable is in the environment,
      // we can use the non-nullable assertion operator (!)
      return env.get(name)!;
    } else {
      throw new Error(`Variable ${name} not found in environment`);
    }
  }

  // To find the value of a variable in an environment
  export function ValueOfVar(env: Environment, name: string): Value {
    if (env.has(name)) {
      return env.get(name)!;
    } else {
      throw new Error(`Variable ${name} not in env: ${JSON.stringify(this)}`);
    }
  }

