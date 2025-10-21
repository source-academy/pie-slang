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


describe('LLM TODO solver - Debug Complex Cases', () => {

  // Helper function to create a test Location
  function createTestLocation(source: string): Location {
    const syntax = new Syntax(
      { line: 1, column: 1 },
      { line: 1, column: 1 },
      source
    );
    return new Location(syntax, false);
  }

  it('should handle Vec type with length 3 - with detailed logging', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:18:1'),
      context: new Map(),
      expectedType: new V.Vec(new V.Nat(), new V.Add1(new V.Add1(new V.Add1(new V.Zero())))),
      renaming: new Map()
    };

    console.log('\n========== VEC TYPE TEST ==========');
    console.log('Expected Type:', inspect(todo.expectedType, { depth: 5, colors: true }));
    console.log('Expected Type (pretty):', todo.expectedType.prettyPrint());
    console.log('Expected Type (readBack):', todo.expectedType.readBackType(todo.context).prettyPrint());
    console.log('Context:', inspect(readBackContext(todo.context), { depth: 3, colors: true }));
    console.log('Starting LLM solve...\n');

    try {
      const solution = await solveTodo(todo);
      console.log('\n✅ SUCCESS!');
      console.log('Solution:', solution);
      console.log('Solution (inspect):', inspect(solution, { colors: true }));

      // Try to parse and verify the solution
      console.log('\nVerifying solution...');
      const parsed = Parser.parsePie(solution);
      console.log('Parsed:', inspect(parsed, { depth: 3, colors: true }));

      const checkResult = parsed.check(todo.context, todo.renaming, todo.expectedType);
      console.log('Type check result:', inspect(checkResult, { depth: 2, colors: true }));
    } catch (error: any) {
      console.log('\n❌ FAILED!');
      console.log('Error:', error.message);
      console.log('Full error:', inspect(error, { depth: 3, colors: true }));
    }
  }, 120000);

  it('should handle List of Pairs (nested types) - with detailed logging', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:38:1'),
      context: new Map(),
      expectedType: new V.List(new V.Sigma('fst', new V.Nat(), new FirstOrderClosure(new Map(), 'snd', new C.Atom()))),
      renaming: new Map()
    };

    console.log('\n========== LIST OF PAIRS TEST ==========');
    console.log('Expected Type:', inspect(todo.expectedType, { depth: 5, colors: true }));
    console.log('Expected Type (pretty):', todo.expectedType.prettyPrint());
    console.log('Expected Type (readBack):', todo.expectedType.readBackType(todo.context).prettyPrint());
    console.log('Context:', inspect(readBackContext(todo.context), { depth: 3, colors: true }));
    console.log('Starting LLM solve...\n');

    try {
      const solution = await solveTodo(todo);
      console.log('\n✅ SUCCESS!');
      console.log('Solution:', solution);
      console.log('Solution (inspect):', inspect(solution, { colors: true }));

      // Try to parse and verify the solution
      console.log('\nVerifying solution...');
      const parsed = Parser.parsePie(solution);
      console.log('Parsed:', inspect(parsed, { depth: 3, colors: true }));

      const checkResult = parsed.check(todo.context, todo.renaming, todo.expectedType);
      console.log('Type check result:', inspect(checkResult, { depth: 2, colors: true }));
    } catch (error: any) {
      console.log('\n❌ FAILED!');
      console.log('Error:', error.message);
      console.log('Full error:', inspect(error, { depth: 3, colors: true }));
    }
  }, 120000);

  it('should handle simpler Vec - length 1', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:simple-vec:1'),
      context: new Map(),
      expectedType: new V.Vec(new V.Nat(), new V.Add1(new V.Zero())),
      renaming: new Map()
    };

    console.log('\n========== SIMPLE VEC (LENGTH 1) TEST ==========');
    console.log('Expected Type (pretty):', todo.expectedType.prettyPrint());
    console.log('Expected Type (readBack):', todo.expectedType.readBackType(todo.context).prettyPrint());
    console.log('Starting LLM solve...\n');

    try {
      const solution = await solveTodo(todo);
      console.log('\n✅ SUCCESS!');
      console.log('Solution:', solution);
    } catch (error: any) {
      console.log('\n❌ FAILED!');
      console.log('Error:', error.message);
    }
  }, 120000);

  it('should handle simple List (without nested complexity)', async () => {
    const todo: TodoInfo = {
      location: createTestLocation('test.pie:simple-list:1'),
      context: new Map(),
      expectedType: new V.List(new V.Nat()),
      renaming: new Map()
    };

    console.log('\n========== SIMPLE LIST TEST ==========');
    console.log('Expected Type (pretty):', todo.expectedType.prettyPrint());
    console.log('Expected Type (readBack):', todo.expectedType.readBackType(todo.context).prettyPrint());
    console.log('Starting LLM solve...\n');

    try {
      const solution = await solveTodo(todo);
      console.log('\n✅ SUCCESS!');
      console.log('Solution:', solution);
    } catch (error: any) {
      console.log('\n❌ FAILED!');
      console.log('Error:', error.message);
    }
  }, 120000);
});
