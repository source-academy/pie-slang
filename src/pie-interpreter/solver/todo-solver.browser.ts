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

export const todoQueue: TodoInfo[] = [];

export function addTodo(todo: TodoInfo): void {
  todoQueue.push(todo);
}

export function clearQueue(): void {
  todoQueue.length = 0;
}

export function clearCache(): void {
  // No cached state when running in the browser.
}

export async function solveTodo(): Promise<string> {
  throw new Error("TODO solving via LLM is not available in the browser environment.");
}
