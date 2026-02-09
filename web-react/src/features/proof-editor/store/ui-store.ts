import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { NodeChange } from '@xyflow/react';
import type { UIStore, UIState, TacticType, ProofNode } from './types';
import { useProofStore } from './proof-store';

// Initial state
const initialState: UIState = {
  selectedNodeId: null,
  draggingTactic: null,
  hoveredNodeId: null,
  validDropTargets: [],
  deleteConfirmation: null,
};

/**
 * UI Store
 *
 * Manages UI-specific state that is separate from proof logic.
 * This includes selection, drag state, hover state, and delete confirmation.
 */
export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set, get) => ({
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

    /**
     * Request deletion of a tactic node.
     * Shows a confirmation modal before deleting.
     */
    requestDelete: (nodeId: string, pendingChanges: NodeChange<ProofNode>[]) => {
      set({ deleteConfirmation: { nodeId, pendingChanges } });
    },

    /**
     * Confirm the pending deletion.
     * Performs cascade delete via proof-store.
     */
    confirmDelete: () => {
      const { deleteConfirmation } = get();
      if (deleteConfirmation) {
        // Perform the cascade delete
        useProofStore.getState().deleteTacticCascade(deleteConfirmation.nodeId);
        // Clear the confirmation state
        set({ deleteConfirmation: null });
      }
    },

    /**
     * Cancel the pending deletion.
     */
    cancelDelete: () => {
      set({ deleteConfirmation: null });
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

export const useDeleteConfirmation = () => useUIStore((s) => s.deleteConfirmation);
