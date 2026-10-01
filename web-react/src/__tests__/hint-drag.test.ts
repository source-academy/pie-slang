import { afterEach, describe, expect, it } from 'vitest';
import { useHintStore } from '../features/proof-editor/store/hint-store';

afterEach(() => useHintStore.getState().clearAllHints());

function createHint() {
  const store = useHintStore.getState();
  const hint = { level: 'category' as const, category: 'introduction' as const, explanation: 'hint', confidence: 0.9 };
  store.updateHint('g', hint);
  store.setGhostNode('g', { id: 'ghost-1', goalId: 'g', position: { x: 10, y: 20 }, hint, isLoading: false });
}
describe('hint card dragging', () => {
  it('stores movement independently of proof nodes', () => {
    createHint();
    const oldMap = useHintStore.getState().goalHints;
    useHintStore.getState().moveGhostNode('ghost-1', { x: 100, y: 200 });
    expect(useHintStore.getState().goalHints.get('g')?.ghostNode?.position).toEqual({ x: 100, y: 200 });
    expect(oldMap.get('g')?.ghostNode?.position).toEqual({ x: 10, y: 20 });
  });
  it('preserves manual position when the next hint level arrives', () => {
    createHint();
    useHintStore.getState().setLoading('g', true);
    useHintStore.getState().moveGhostNode('ghost-1', { x: 110, y: 220 });
    useHintStore.getState().updateHint('g', { level: 'tactic', tacticType: 'intro', explanation: 'more', confidence: 0.9 });
    expect(useHintStore.getState().goalHints.get('g')?.ghostNode?.position).toEqual({ x: 110, y: 220 });
  });
  it('ignores non-finite coordinates and dismissed cards', () => {
    createHint();
    useHintStore.getState().moveGhostNode('ghost-1', { x: NaN, y: 0 });
    expect(useHintStore.getState().goalHints.get('g')?.ghostNode?.position).toEqual({ x: 10, y: 20 });
    useHintStore.getState().dismissGhostNode('g');
    useHintStore.getState().moveGhostNode('ghost-1', { x: 10, y: 20 });
    expect(useHintStore.getState().goalHints.get('g')?.ghostNode).toBeNull();
  });
});
