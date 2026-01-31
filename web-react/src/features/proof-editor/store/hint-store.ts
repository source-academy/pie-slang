import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { HintLevel, ProgressiveHintResponse } from '@/workers/proof-worker';

/**
 * Ghost node representing a hint suggestion
 */
export interface GhostNode {
  id: string;
  goalId: string;
  position: { x: number; y: number };
  hint: ProgressiveHintResponse;
  isLoading: boolean;
}

/**
 * Hint state for a specific goal
 */
export interface GoalHintState {
  goalId: string;
  currentLevel: HintLevel;
  hints: ProgressiveHintResponse[]; // History of hints at each level
  ghostNode: GhostNode | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hint store state
 */
export interface HintState {
  // Map of goalId -> hint state
  goalHints: Map<string, GoalHintState>;

  // Currently active ghost node (only one at a time for clarity)
  activeGhostNodeId: string | null;

  // API key for AI-powered hints (optional)
  apiKey: string | null;
}

/**
 * Hint store actions
 */
export interface HintActions {
  // Request a hint for a goal
  requestHint: (goalId: string) => void;

  // Set loading state for a goal
  setLoading: (goalId: string, isLoading: boolean) => void;

  // Update hint for a goal (called when worker responds)
  updateHint: (goalId: string, hint: ProgressiveHintResponse) => void;

  // Set error for a goal
  setError: (goalId: string, error: string | null) => void;

  // Create/update ghost node for a goal
  setGhostNode: (goalId: string, ghostNode: GhostNode | null) => void;

  // Accept the ghost node (convert to real tactic)
  acceptGhostNode: (goalId: string) => void;

  // Dismiss the ghost node
  dismissGhostNode: (goalId: string) => void;

  // Get more detail (next hint level)
  requestMoreDetail: (goalId: string) => void;

  // Set API key
  setApiKey: (key: string | null) => void;

  // Clear all hints
  clearAllHints: () => void;

  // Clear hint for a specific goal
  clearHint: (goalId: string) => void;

  // Get hint state for a goal
  getGoalHintState: (goalId: string) => GoalHintState | undefined;
}

export type HintStore = HintState & HintActions;

const initialState: HintState = {
  goalHints: new Map(),
  activeGhostNodeId: null,
  apiKey: null,
};

/**
 * Hint Store
 *
 * Manages the progressive hint system state including ghost nodes.
 */
export const useHintStore = create<HintStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    requestHint: (goalId: string) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing) {
          // Already have hints - don't reset, just mark as loading
          newGoalHints.set(goalId, {
            ...existing,
            isLoading: true,
            error: null,
          });
        } else {
          // New hint request - start at category level
          newGoalHints.set(goalId, {
            goalId,
            currentLevel: 'category',
            hints: [],
            ghostNode: null,
            isLoading: true,
            error: null,
          });
        }

        return { goalHints: newGoalHints };
      });
    },

    setLoading: (goalId: string, isLoading: boolean) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing) {
          newGoalHints.set(goalId, { ...existing, isLoading });
        }

        return { goalHints: newGoalHints };
      });
    },

    updateHint: (goalId: string, hint: ProgressiveHintResponse) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing) {
          newGoalHints.set(goalId, {
            ...existing,
            currentLevel: hint.level,
            hints: [...existing.hints, hint],
            isLoading: false,
            error: null,
          });
        } else {
          newGoalHints.set(goalId, {
            goalId,
            currentLevel: hint.level,
            hints: [hint],
            ghostNode: null,
            isLoading: false,
            error: null,
          });
        }

        return { goalHints: newGoalHints };
      });
    },

    setError: (goalId: string, error: string | null) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing) {
          newGoalHints.set(goalId, {
            ...existing,
            isLoading: false,
            error,
          });
        }

        return { goalHints: newGoalHints };
      });
    },

    setGhostNode: (goalId: string, ghostNode: GhostNode | null) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing) {
          newGoalHints.set(goalId, { ...existing, ghostNode });
        }

        return {
          goalHints: newGoalHints,
          activeGhostNodeId: ghostNode?.id || null,
        };
      });
    },

    acceptGhostNode: (goalId: string) => {
      // This will be handled by the UI component to create a real tactic node
      // Just clear the ghost node here
      get().dismissGhostNode(goalId);
    },

    dismissGhostNode: (goalId: string) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing) {
          newGoalHints.set(goalId, { ...existing, ghostNode: null });
        }

        return {
          goalHints: newGoalHints,
          activeGhostNodeId: state.activeGhostNodeId === existing?.ghostNode?.id
            ? null
            : state.activeGhostNodeId,
        };
      });
    },

    requestMoreDetail: (goalId: string) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        const existing = newGoalHints.get(goalId);

        if (existing && existing.currentLevel !== 'full') {
          const nextLevel: HintLevel =
            existing.currentLevel === 'category' ? 'tactic' : 'full';

          newGoalHints.set(goalId, {
            ...existing,
            currentLevel: nextLevel,
            isLoading: true,
            error: null,
          });
        }

        return { goalHints: newGoalHints };
      });
    },

    setApiKey: (key: string | null) => {
      set({ apiKey: key });
    },

    clearAllHints: () => {
      set({
        goalHints: new Map(),
        activeGhostNodeId: null,
      });
    },

    clearHint: (goalId: string) => {
      set((state) => {
        const newGoalHints = new Map(state.goalHints);
        newGoalHints.delete(goalId);

        return { goalHints: newGoalHints };
      });
    },

    getGoalHintState: (goalId: string) => {
      return get().goalHints.get(goalId);
    },
  }))
);

// Convenience selectors
export const useGoalHintState = (goalId: string) =>
  useHintStore((s) => s.goalHints.get(goalId));

export const useActiveGhostNode = () =>
  useHintStore((s) => {
    if (!s.activeGhostNodeId) return null;
    for (const hintState of s.goalHints.values()) {
      if (hintState.ghostNode?.id === s.activeGhostNodeId) {
        return hintState.ghostNode;
      }
    }
    return null;
  });

export const useHintApiKey = () => useHintStore((s) => s.apiKey);
