import { Value } from '../types/value';
export type Environment = Map<string, Value>;
export declare function extendEnvironment(env: Environment, name: string, value: Value): Environment;
export declare function getValueFromEnvironment(env: Environment, name: string): Value;
export declare function ValueOfVar(env: Environment, name: string): Value;
//# sourceMappingURL=environment.d.ts.map