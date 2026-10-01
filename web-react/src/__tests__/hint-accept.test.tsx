import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HintResponse } from '@pie/protocol';
import { useHintSystem } from '../features/proof-editor/hooks/useHintSystem';
import { useHintStore, useProofStore } from '../features/proof-editor/store';
import { setApplyTacticCallback } from '../features/proof-editor/utils/tactic-callback';

// Accept must use the existing suggestion, never request another model response.
vi.mock('@/shared/lib/worker-client', () => ({ proofWorker: {} }));

let root: Root;
let container: HTMLDivElement;
let goalId: string;
const apply = vi.fn(async () => {});

function AcceptButton() {
  const { acceptGhostNode } = useHintSystem();
  return <button onClick={() => acceptGhostNode(goalId)}>Accept</button>;
}

function showHint(overrides: Partial<HintResponse> = {}) {
  const hint: HintResponse = {
    level: 'tactic', tacticType: 'intro', source: 'lora',
    explanation: 'Introduce the variable.', confidence: 0.9, ...overrides,
  };
  act(() => {
    useHintStore.getState().updateHint(goalId, hint);
    useHintStore.getState().setGhostNode(goalId, {
      id: 'ghost-test', goalId, position: { x: 50, y: 250 }, hint, isLoading: false,
    });
  });
}

async function clickAccept(times = 1) {
  await act(async () => {
    for (let i = 0; i < times; i++) container.querySelector('button')!.click();
    await vi.runAllTimersAsync();
  });
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  apply.mockClear();
  setApplyTacticCallback(apply);
  useProofStore.getState().reset();
  useHintStore.getState().clearAllHints();
  goalId = useProofStore.getState().addGoalNode({
    kind: 'goal', goalType: '(-> Nat Nat)', context: [], status: 'pending',
  }, { x: 50, y: 100 });
  // Another goal must not steal the accepted suggestion's connection.
  useProofStore.getState().addGoalNode({
    kind: 'goal', goalType: 'Nat', context: [], status: 'pending',
  }, { x: 400, y: 100 });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<AcceptButton />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  setApplyTacticCallback(null);
  useProofStore.getState().reset();
  useHintStore.getState().clearAllHints();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('accepting a tactic hint', () => {
  it('connects to the requesting goal and applies a parameterless tactic once', async () => {
    showHint();
    await clickAccept();
    const { nodes, edges } = useProofStore.getState();
    const tactic = nodes.find(n => n.type === 'tactic')!;
    expect(tactic.data.connectedGoalId).toBe(goalId);
    expect(edges).toEqual([expect.objectContaining({
      source: goalId, target: tactic.id,
      sourceHandle: 'goal-output', targetHandle: 'goal-input',
      data: { kind: 'goal-to-tactic' },
    })]);
    expect(apply).toHaveBeenCalledExactlyOnceWith({
      goalId, tacticType: 'intro', params: {}, tacticNodeId: tactic.id,
    });
    expect(useHintStore.getState().goalHints.get(goalId)?.ghostNode).toBeNull();
    // Only the kernel callback may mark a proof complete, not accepting the hint.
    expect(nodes.find(n => n.id === goalId)?.data.status).toBe('pending');
  });

  it('connects a tactic with missing parameters without applying it', async () => {
    showHint({ tacticType: 'exact', parameters: undefined });
    await clickAccept();
    const { nodes, edges } = useProofStore.getState();
    const tactic = nodes.find(n => n.type === 'tactic')!;
    expect(tactic.data.status).toBe('incomplete');
    expect(tactic.data.connectedGoalId).toBe(goalId);
    expect(edges[0]).toMatchObject({ source: goalId, target: tactic.id });
    expect(apply).not.toHaveBeenCalled();
  });

  it('passes supplied parameters and the node id to the normal application path', async () => {
    showHint({ tacticType: 'exact', parameters: { expression: '(lambda (n) n)' } });
    await clickAccept();
    const tactic = useProofStore.getState().nodes.find(n => n.type === 'tactic')!;
    expect(apply).toHaveBeenCalledExactlyOnceWith({
      goalId, tacticType: 'exact', params: { expression: '(lambda (n) n)' }, tacticNodeId: tactic.id,
    });
  });

  it('does not duplicate nodes, edges or execution on a double click', async () => {
    showHint();
    await clickAccept(2);
    expect(useProofStore.getState().nodes.filter(n => n.type === 'tactic')).toHaveLength(1);
    expect(useProofStore.getState().edges).toHaveLength(1);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('ignores a hint whose requesting goal has been removed', async () => {
    showHint();
    act(() => useProofStore.getState().reset());
    await clickAccept();
    expect(useProofStore.getState().nodes).toHaveLength(0);
    expect(useProofStore.getState().edges).toHaveLength(0);
    expect(apply).not.toHaveBeenCalled();
  });

  it('does not create a tactic for a category-only hint', async () => {
    showHint({ level: 'category', tacticType: undefined });
    await clickAccept();
    expect(useProofStore.getState().nodes.filter(n => n.type === 'tactic')).toHaveLength(0);
    expect(useProofStore.getState().edges).toHaveLength(0);
    expect(apply).not.toHaveBeenCalled();
  });
});
