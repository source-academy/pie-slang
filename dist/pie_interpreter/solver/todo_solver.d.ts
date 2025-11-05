import { Location } from "../utils/locations";
import { Context } from "../utils/context";
import { Value } from "../types/value";
import { Renaming } from "../typechecker/utils";
import 'dotenv/config';
export interface TodoInfo {
    location: Location;
    context: Context;
    expectedType: Value;
    renaming: Renaming;
}
export declare const todoQueue: TodoInfo[];
export declare function addTodo(todo: TodoInfo): void;
export declare function clearQueue(): void;
export declare function clearCache(): void;
export declare function solveTodo(todo: TodoInfo): Promise<string>;
//# sourceMappingURL=todo_solver.d.ts.map