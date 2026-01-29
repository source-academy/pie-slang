import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UIStore, UIState, TacticType } from './types';

// Initial state
const initialState: UIState = {
  selectedNodeId: null,
  draggingTactic: null,
  hoveredNodeId: null,
  validDropTargets: [],
};

/**
 * UI Store
 *
 * Manages UI-specific state that is separate from proof logic.
 * This includes selection, drag state, and hover state.
 */
export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    selectNode: (id: string | null) => {
      set({ selectedNodeId: id });
    },

    setDraggingTactic: (type: TacticType | null) => {
      set({ draggingTactic: type });
    },

    setHoveredNode: (id: string | null) => {
      set({ hoveredNodeId: id });
    },

    setValidDropTargets: (goalIds: string[]) => {
      set({ validDropTargets: goalIds });
    },

    clearDragState: () => {
      set({
        draggingTactic: null,
        validDropTargets: [],
      });
    },
  }))
);

// Convenience selectors
export const useSelectedNodeId = () => useUIStore((s) => s.selectedNodeId);
export const useDraggingTactic = () => useUIStore((s) => s.draggingTactic);
export const useHoveredNodeId = () => useUIStore((s) => s.hoveredNodeId);
export const useValidDropTargets = () => useUIStore((s) => s.validDropTargets);

/**
 * Check if a node is a valid drop target for the current dragging tactic
 */
export const useIsValidDropTarget = (nodeId: string) =>
  useUIStore((s) => s.validDropTargets.includes(nodeId));
