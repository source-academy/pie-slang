import { solveTodo, todoQueue } from "./todo_solver";

async function main() {
  // Run type checker to collect TODOs
  // Then solve each one
  for (const todo of todoQueue) {
    const solution = await solveTodo(todo);
    console.log(`\n=== ${todo.location} ===`);
    console.log(solution);
  }
}