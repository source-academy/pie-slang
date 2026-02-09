import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================
// Metadata Store Types
// ============================================

export interface GlobalContext {
  definitions: Array<{ name: string; type: string; kind: 'definition' | 'claim' | 'theorem' }>;
  theorems: Array<{ name: string; type: string; kind: 'definition' | 'claim' | 'theorem' }>;
}

export interface MetadataState {
  globalContext: GlobalContext;
  claimName: string | null;
}

export interface MetadataActions {
  setGlobalContext: (context: GlobalContext) => void;
  setClaimName: (name: string | null) => void;
  reset: () => void;
}

export type MetadataStore = MetadataState & MetadataActions;

// Initial state
const initialState: MetadataState = {
  globalContext: { definitions: [], theorems: [] },
  claimName: null,
};

/**
 * Metadata Store
 *
 * Manages proof metadata including:
 * - Global context (definitions and theorems from source code)
 * - Current claim name being proved
 */
export const useMetadataStore = create<MetadataStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setGlobalContext: (context: GlobalContext) => {
      set({ globalContext: context });
    },

    setClaimName: (name: string | null) => {
      set({ claimName: name });
    },

    reset: () => {
      set(initialState);
    },
  }))
);

// Convenience selectors
export const useGlobalContextFromMetadata = () => useMetadataStore((s) => s.globalContext);
export const useClaimName = () => useMetadataStore((s) => s.claimName);
export const useDefinitions = () => useMetadataStore((s) => s.globalContext.definitions);
export const useTheorems = () => useMetadataStore((s) => s.globalContext.theorems);
