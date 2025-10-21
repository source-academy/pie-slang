import { GoogleGenAI } from "@google/genai";
import 'jest'
import { solveTodo, TodoInfo } from '../try_llm/todo_solver';
import { inspect } from 'util';
import { Parser } from '../parser/parser';
import { Location, Syntax } from '../utils/locations';
import * as V from '../types/value';
import * as C from '../types/core';
import { FirstOrderClosure } from '../types/utils';
import { readBackContext } from '../utils/context';

describe('LLM TODO solver with typechecking', () => {

  // Helper function to create a test Location
  function createTestLocation(source: string): Location {
    const syntax = new Syntax(
      { line: 1, column: 1 },
      { line: 1, column: 1 },
      source
    );
    return new Location(syntax, false);
  }

  // Helper function to log test results in a clear format (4 lines only)
  function logTestResult(todo: TodoInfo, solution: string, testName: string) {
    // Format context
    let contextStr = 'empty';
    if (todo.context.size > 0) {
      const ctxEntries: string[] = [];
      for (const [name, binder] of todo.context.entries()) {
        let typeStr: string;
        if ('type' in binder && binder.type) {
          typeStr = (binder.type as any).prettyPrint();
        } else if ('prettyPrint' in binder) {
          typeStr = (binder as any).prettyPrint();
        } else {
          typeStr = String(binder);
        }
        ctxEntries.push(`${name}: ${typeStr}`);
      }
      contextStr = ctxEntries.join(', ');
    }

    // Format renaming
    const renamingStr = todo.renaming.size === 0 ? 'empty' :
      Array.from(todo.renaming.entries()).map(([k, v]) => `${k}→${v}`).join(', ');

    // 4-line output only
    console.log(
      `Expected: ${todo.expectedType.readBackType(todo.context).prettyPrint()}\n` +
      `Context: ${contextStr}\n` +
      `Renaming: ${renamingStr}\n` +
      `Result: ${solution}`
    );
  }

  it('should solve simple Nat TODO with add1', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:2:1'),
      context: new Map(),
      expectedType: new V.Nat(),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Simple Nat');
  }, 60000);

  it('should handle List type TODO', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:6:1'),
      context: new Map(),
      expectedType: new V.List(new V.Nat()),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'List Nat');
  }, 60000);

  it('it should solve identity function TODO', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:10:1'),
      context: new Map(),
      expectedType: new V.Pi('x', new V.Nat(), new FirstOrderClosure(new Map(), 'x', new C.Nat())),
      renaming: new Map()
    };
    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Identity Function (Nat -> Nat)');
  }, 60000);

  it('should handle Sigma type (dependent pair)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:14:1'),
      context: new Map(),
      expectedType: new V.Sigma('x', new V.Nat(), new FirstOrderClosure(new Map(), 'x', new C.Nat())),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Sigma Type (Dependent Pair)');
  }, 60000);

  it('should handle Vec type with length 3', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:18:1'),
      context: new Map(),
      expectedType: new V.Vec(new V.Nat(), new V.Add1(new V.Add1(new V.Add1(new V.Zero())))),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Vec Nat length 3');
  }, 60000);

  it('should handle Either type', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:22:1'),
      context: new Map(),
      expectedType: new V.Either(new V.Nat(), new V.Atom()),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Either Nat Atom');
  }, 60000);

  it('should handle Equal type (equality proof)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:26:1'),
      context: new Map(),
      expectedType: new V.Equal(new V.Nat(), new V.Zero(), new V.Zero()),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Equal (zero = zero)');
  }, 60000);

  it('should handle Trivial type', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:30:1'),
      context: new Map(),
      expectedType: new V.Trivial(),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Trivial');
  }, 60000);

  it('should handle multi-argument Pi type (Nat -> Nat -> Nat)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:34:1'),
      context: new Map(),
      expectedType: new V.Pi('x', new V.Nat(),
        new FirstOrderClosure(new Map(), 'y',
          new C.Pi('y', new C.Nat(), new C.Nat()))),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Multi-arg Pi (Nat -> Nat -> Nat)');
  }, 60000);

  it('should handle List of Pairs (nested types)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:38:1'),
      context: new Map(),
      expectedType: new V.List(new V.Sigma('fst', new V.Nat(), new FirstOrderClosure(new Map(), 'snd', new C.Atom()))),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'List of Pairs (nested)');
  }, 60000);

  it('should use variable from context - simple case', async () => {
    const ctx = new Map();
    ctx.set('n', new V.Nat());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:42:1'),
      context: ctx,
      expectedType: new V.Nat(),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Context: n: Nat');
  }, 60000);

  it('should use multiple variables from context', async () => {
    const ctx = new Map();
    ctx.set('x', new V.Nat());
    ctx.set('y', new V.Nat());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:46:1'),
      context: ctx,
      expectedType: new V.Nat(),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Context: x,y: Nat');
  }, 60000);

  it('should construct function using context variable', async () => {
    const ctx = new Map();
    ctx.set('m', new V.Nat());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:50:1'),
      context: ctx,
      expectedType: new V.Pi('n', new V.Nat(), new FirstOrderClosure(new Map(), 'n', new C.Nat())),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Function with Context (m: Nat)');
  }, 60000);

  it('should handle context with Atom variable', async () => {
    const ctx = new Map();
    ctx.set('tag', new V.Atom());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:54:1'),
      context: ctx,
      expectedType: new V.Atom(),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Context: tag: Atom');
  }, 60000);

  it('should handle context with List variable', async () => {
    const ctx = new Map();
    ctx.set('xs', new V.List(new V.Nat()));

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:58:1'),
      context: ctx,
      expectedType: new V.List(new V.Nat()),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Context: xs: List Nat');
  }, 60000);

  it('should construct pair using context variables', async () => {
    const ctx = new Map();
    ctx.set('a', new V.Nat());
    ctx.set('b', new V.Atom());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:62:1'),
      context: ctx,
      expectedType: new V.Sigma('fst', new V.Nat(), new FirstOrderClosure(new Map(), 'snd', new C.Atom())),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Pair from Context (a,b)');
  }, 60000);

  it('should handle renaming map', async () => {
    const ctx = new Map();
    ctx.set('n', new V.Nat());

    const renaming = new Map();
    renaming.set('n', 'n-renamed');

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:66:1'),
      context: ctx,
      expectedType: new V.Nat(),
      renaming: renaming
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'With Renaming Map');
  }, 60000);

  it('should handle Vec of Either types', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:70:1'),
      context: new Map(),
      expectedType: new V.Vec(
        new V.Either(new V.Nat(), new V.Trivial()),
        new V.Add1(new V.Add1(new V.Zero()))
      ),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Vec of Either types');
  }, 60000);

  it('should handle complex dependent type with context', async () => {
    const ctx = new Map();
    ctx.set('len', new V.Nat());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:74:1'),
      context: ctx,
      expectedType: new V.Pi('E', new V.Universe(),
        new FirstOrderClosure(new Map([['len', new V.Nat()]]), 'E',
          new C.Pi('_unused', new C.VarName('E'), new C.Vec(new C.VarName('E'), new C.VarName('len'))))),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Complex Dependent Type');
  }, 60000);

  it('should handle function returning Equal type', async () => {
    const ctx = new Map();
    ctx.set('x', new V.Nat());

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:78:1'),
      context: ctx,
      expectedType: new V.Pi('y', new V.Nat(),
        new FirstOrderClosure(new Map([['x', new V.Nat()]]), 'y',
          new C.Equal(new C.Nat(), new C.VarName('x'), new C.VarName('y')))),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Function returning Equal');
  }, 60000);

  it('should handle nested Sigma types', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:82:1'),
      context: new Map(),
      expectedType: new V.Sigma('outer', new V.Nat(),
        new FirstOrderClosure(new Map(), 'inner',
          new C.Sigma('inner', new C.Atom(), new C.Trivial()))),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Nested Sigma types');
  }, 60000);

  it('should handle Atom type', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:86:1'),
      context: new Map(),
      expectedType: new V.Atom(),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution, 'Atom type');
  }, 60000);
});
