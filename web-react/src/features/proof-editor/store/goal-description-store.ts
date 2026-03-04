import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalDescriptionEntry {
  text: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface GoalDescriptionState {
  /** Cached descriptions keyed by goal node id. */
  descriptions: Map<string, GoalDescriptionEntry>;
}

export interface GoalDescriptionActions {
  /** Mark a goal as loading (clears previous error). */
  setLoading: (nodeId: string) => void;
  /** Store a successfully generated description. */
  setDescription: (nodeId: string, text: string) => void;
  /** Store an error for a goal. */
  setError: (nodeId: string, error: string) => void;
  /** Remove all cached entries (e.g. when a new proof session starts). */
  clearAll: () => void;
  /** Get the current entry for a goal, or undefined if not yet fetched. */
  getEntry: (nodeId: string) => GoalDescriptionEntry | undefined;
}

export type GoalDescriptionStore = GoalDescriptionState &
  GoalDescriptionActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGoalDescriptionStore = create<GoalDescriptionStore>()(
  subscribeWithSelector((set, get) => ({
    descriptions: new Map(),

    setLoading: (nodeId) => {
      set((state) => {
        const next = new Map(state.descriptions);
        next.set(nodeId, { text: null, isLoading: true, error: null });
        return { descriptions: next };
      });
    },

    setDescription: (nodeId, text) => {
      set((state) => {
        const next = new Map(state.descriptions);
        next.set(nodeId, { text, isLoading: false, error: null });
        return { descriptions: next };
      });
    },

    setError: (nodeId, error) => {
      set((state) => {
        const next = new Map(state.descriptions);
        next.set(nodeId, { text: null, isLoading: false, error });
        return { descriptions: next };
      });
    },

    clearAll: () => {
      set({ descriptions: new Map() });
    },

    getEntry: (nodeId) => {
      return get().descriptions.get(nodeId);
    },
  })),
);
