import type { Context } from "../utils/context";
import type { Location } from "../utils/locations";
import type { Value } from "../types/value";
import type { Renaming } from "../typechecker/utils";
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
export declare function solveTodo(): Promise<string>;
//# sourceMappingURL=todo_solver.browser.d.ts.map