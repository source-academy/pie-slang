import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ProofNode, ProofEdge, ProofSnapshot } from './types';

// ============================================
// History Store Types
// ============================================

export interface HistoryState {
  history: ProofSnapshot[];
  historyIndex: number;
}

export interface HistoryActions {
  saveSnapshot: (nodes: ProofNode[], edges: ProofEdge[]) => void;
  undo: () => ProofSnapshot | null;
  redo: () => ProofSnapshot | null;
  reset: () => void;
}

export interface HistoryStore extends HistoryState, HistoryActions {
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Initial state
const initialState: HistoryState = {
  history: [],
  historyIndex: -1,
};

/**
 * History Store
 *
 * Manages undo/redo history for the proof editor.
 * Stores snapshots of nodes and edges state.
 *
 * Usage:
 * - Call saveSnapshot(nodes, edges) after each significant change
 * - Call undo() to restore the previous state (returns the snapshot to apply)
 * - Call redo() to restore the next state (returns the snapshot to apply)
 */
export const useHistoryStore = create<HistoryStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      /**
       * Save a snapshot of the current state.
       * Truncates any redo history.
       */
      saveSnapshot: (nodes: ProofNode[], edges: ProofEdge[]) => {
        set((state) => {
          const snapshot: ProofSnapshot = {
            nodes: JSON.parse(JSON.stringify(nodes)) as ProofNode[],
            edges: JSON.parse(JSON.stringify(edges)) as ProofEdge[],
            timestamp: Date.now(),
          };
          // Truncate any redo history
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(snapshot);
          state.historyIndex = state.history.length - 1;
        });
      },

      /**
       * Undo the last action.
       * Returns the snapshot to apply, or null if nothing to undo.
       */
      undo: () => {
        const state = get();
        if (state.historyIndex >= 0 && state.historyIndex < state.history.length) {
          const snapshot = state.history[state.historyIndex];
          set((s) => {
            s.historyIndex -= 1;
          });
          return {
            nodes: JSON.parse(JSON.stringify(snapshot.nodes)) as ProofNode[],
            edges: JSON.parse(JSON.stringify(snapshot.edges)) as ProofEdge[],
            timestamp: snapshot.timestamp,
          };
        }
        return null;
      },

      /**
       * Redo the last undone action.
       * Returns the snapshot to apply, or null if nothing to redo.
       */
      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          set((s) => {
            s.historyIndex += 1;
          });
          const newState = get();
          const snapshot = newState.history[newState.historyIndex];
          return {
            nodes: JSON.parse(JSON.stringify(snapshot.nodes)) as ProofNode[],
            edges: JSON.parse(JSON.stringify(snapshot.edges)) as ProofEdge[],
            timestamp: snapshot.timestamp,
          };
        }
        return null;
      },

      /**
       * Check if undo is available.
       */
      canUndo: () => {
        const state = get();
        return state.historyIndex >= 0;
      },

      /**
       * Check if redo is available.
       */
      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },

      /**
       * Reset history to initial state.
       */
      reset: () => {
        set(() => initialState);
      },
    }))
  )
);

// Convenience selectors
export const useHistoryIndex = () => useHistoryStore((s) => s.historyIndex);
export const useHistoryLength = () => useHistoryStore((s) => s.history.length);
