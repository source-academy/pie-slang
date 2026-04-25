import 'jest';
import * as C from '../types/core';
import { readBackContext, bindFree } from '../utils/context';
import * as V from '../types/value';
import { clearQueue, todoQueue } from '../solver/todo-solver';
import { deserializeSerializableContext, PieInfoHook } from '../typechecker/utils';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme-parser/transpiler/types/location';

const testLocation = new Location(
  new Syntax(
    new Position(1, 1),
    new Position(1, 5),
    'test.pie',
  ),
  true,
);

describe('TODO context capture', () => {
  beforeEach(() => {
    clearQueue();
  });

  it('deserializes free variables from SerializableContext', () => {
    const ctx = bindFree(new Map(), 'x', new V.Nat());
    const serialized = readBackContext(ctx);
    const restored = deserializeSerializableContext(serialized);

    expect(restored.has('x')).toBe(true);
    expect(restored.get('x')?.type.prettyPrint()).toBe('Nat');
  });

  it('queues TODOs with the in-scope context', () => {
    const ctx = bindFree(new Map(), 'x', new V.Nat());
    const serialized = readBackContext(ctx);

    PieInfoHook(testLocation, ['TODO', serialized, new C.Nat(), new Map()]);

    expect(todoQueue).toHaveLength(1);
    expect(todoQueue[0].context.has('x')).toBe(true);
    expect(todoQueue[0].expectedType.prettyPrint()).toBe('Nat');
  });
});
