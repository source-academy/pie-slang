import 'jest';
import { todoQueue, addTodo, clearQueue, solveTodo, TodoInfo } from '../try_llm/todo_solver';
import { inspect } from 'util';
import { Location, Syntax } from '../utils/locations';
import * as V from '../types/value';

describe('LLM TODO Queue Sequential Solving', () => {

  // Helper function to create a test Location
  function createTestLocation(source: string): Location {
    const syntax = new Syntax(
      { line: 1, column: 1 },
      { line: 1, column: 1 },
      source
    );
    return new Location(syntax, false);
  }

  beforeEach(() => {
    clearQueue();
  });

  it('should solve two TODOs sequentially from queue', async () => {
    // Add two TODOs to the queue
    const todo1: TodoInfo = {
      location: createTestLocation('test.pie:1:1'),
      context: new Map(),
      expectedType: new V.Nat(),
      renaming: new Map()
    };

    const todo2: TodoInfo = {
      location: createTestLocation('test.pie:2:1'),
      context: new Map(),
      expectedType: new V.Trivial(),
      renaming: new Map()
    };

    addTodo(todo1);
    addTodo(todo2);

    console.log('Initial queue length:', todoQueue.length);
    console.log('TODOs in queue:');
    todoQueue.forEach((todo, i) => {
      console.log(`  [${i}] ${todo.location.toString()} - Expected type: ${todo.expectedType.constructor.name}`);
    });

    // Solve each TODO sequentially
    console.log('\n=== Solving TODOs sequentially ===\n');

    for (let i = 0; i < todoQueue.length; i++) {
      const todo = todoQueue[i];
      console.log(`\n--- Solving TODO ${i + 1}/${todoQueue.length} ---`);
      console.log(`Location: ${todo.location.toString()}`);
      console.log(`Expected type: ${todo.expectedType.constructor.name}`);

      const solution = await solveTodo(todo);

      console.log(`Solution: ${inspect(solution, true, null, true)}`);
    }

    console.log('\n=== All TODOs solved ===');
  }, 120000);

  it('should solve three different type TODOs sequentially', async () => {
    const todos: TodoInfo[] = [
      {
        location: createTestLocation('test.pie:1:1'),
        context: new Map(),
        expectedType: new V.Nat(),
        renaming: new Map()
      },
      {
        location: createTestLocation('test.pie:2:1'),
        context: new Map(),
        expectedType: new V.Atom(),
        renaming: new Map()
      },
      {
        location: createTestLocation('test.pie:3:1'),
        context: new Map(),
        expectedType: new V.List(new V.Nat()),
        renaming: new Map()
      }
    ];

    todos.forEach(todo => addTodo(todo));

    console.log('Queue size:', todoQueue.length);

    for (let i = 0; i < todoQueue.length; i++) {
      const todo = todoQueue[i];
      console.log(`\n[${i + 1}/${todoQueue.length}] ${todo.location.toString()}`);

      const solution = await solveTodo(todo);

      console.log('Solution:', inspect(solution, true, null, true));
    }
  }, 180000);

});
