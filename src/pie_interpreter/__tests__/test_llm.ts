import { GoogleGenAI } from "@google/genai";
import 'jest'
import { solveTodo, TodoInfo } from '../try_llm/todo_solver';
import { inspect } from 'util';
import { Parser } from '../parser/parser';
import { Location, Syntax } from '../utils/locations';
import * as V from '../types/value';
import * as C from '../types/core';
import { FirstOrderClosure, go, stop } from '../types/utils';
import { readBackContext, valInContext } from '../utils/context';

describe('LLM TODO solver with typechecking', () => {

  // Helper function to parse Pie code into a Value (for types)
  function parseExpectedType(pieCode: string): V.Value {
    const parsed = Parser.parsePie(pieCode);
    const typeResult = parsed.isType(new Map(), new Map());
    if (typeResult instanceof go) {
      return valInContext(new Map(), typeResult.result);
    } else if (typeResult instanceof stop) {
      throw new Error(`Invalid type: ${pieCode} - ${typeResult.message}`);
    } else {
      throw new Error(`Invalid type result: ${pieCode}`);
    }
  }

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
  function logTestResult(todo: TodoInfo, solution: string) {
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

  it('should solve simple Nat TODO', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:2:1'),
      context: new Map(),
      expectedType: parseExpectedType("Nat"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle List type TODO', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:6:1'),
      context: new Map(),
      expectedType: parseExpectedType("(List Nat)"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('it should solve identity function TODO', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:10:1'),
      context: new Map(),
      expectedType: parseExpectedType("(-> Nat Nat)"),
      renaming: new Map()
    };
    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle Sigma type (dependent pair)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:14:1'),
      context: new Map(),
      expectedType: parseExpectedType("(Pair Nat Nat)"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle Vec type with length 3', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:18:1'),
      context: new Map(),
      expectedType: parseExpectedType("(Vec Nat (add1 (add1 (add1 zero))))"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle Either type', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:22:1'),
      context: new Map(),
      expectedType: parseExpectedType("(Either Nat Atom)"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle Equal type (equality proof)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:26:1'),
      context: new Map(),
      expectedType: parseExpectedType("(= Nat zero zero)"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle Trivial type', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:30:1'),
      context: new Map(),
      expectedType: parseExpectedType("Trivial"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle multi-argument Pi type (Nat -> Nat -> Nat)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:34:1'),
      context: new Map(),
      expectedType: parseExpectedType("(-> Nat Nat Nat)"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle List of Pairs (nested types)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:38:1'),
      context: new Map(),
      expectedType: parseExpectedType("(List (Pair Nat Atom))"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should use variable from context - simple case', async () => {
    const ctx = new Map();
    ctx.set('n', parseExpectedType("A"));

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:42:1'),
      context: ctx,
      expectedType: parseExpectedType("A"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should use multiple variables from context', async () => {
    const ctx = new Map();
    ctx.set('x', parseExpectedType("A"));
    ctx.set('y', parseExpectedType("B"));

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:46:1'),
      context: ctx,
      expectedType: parseExpectedType("B"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should construct function using context variable', async () => {
    const ctx = new Map();
    ctx.set('m', parseExpectedType("A"));

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:50:1'),
      context: ctx,
      expectedType: parseExpectedType("(-> Nat A)"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle renaming map', async () => {
    const ctx = new Map();
    ctx.set('n', parseExpectedType("A"));

    const renaming = new Map();
    renaming.set('n', 'n-renamed');

    const todo: TodoInfo = {
      location: createTestLocation('test.pie:66:1'),
      context: ctx,
      expectedType: parseExpectedType("A"),
      renaming: renaming
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  it('should handle Vec of Either types', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:70:1'),
      context: new Map(),
      expectedType: parseExpectedType("(Vec (Either Nat Trivial) (add1 (add1 zero)))"),
      renaming: new Map()
    };

    const solution = await solveTodo(todo);
    logTestResult(todo, solution);
  }, 60000);

  
});
