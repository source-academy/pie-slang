import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getExampleById } from '../data/examples';

// ============================================
// Example Store Types
// ============================================

export interface ExampleState {
  selectedExample: string;
  exampleSource: string | undefined;
  exampleClaim: string | undefined;
}

export interface ExampleActions {
  selectExample: (exampleId: string) => void;
  clearExample: () => void;
}

export type ExampleStore = ExampleState & ExampleActions;

// Initial state
const initialState: ExampleState = {
  selectedExample: '',
  exampleSource: undefined,
  exampleClaim: undefined,
};

/**
 * Example Store
 *
 * Manages example selection state for the proof editor.
 * When an example is selected, its source code and default claim
 * are loaded and made available to the SourceCodePanel.
 */
export const useExampleStore = create<ExampleStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    /**
     * Select an example by ID.
     * Loads the example's source code and default claim.
     */
    selectExample: (exampleId: string) => {
      if (!exampleId) {
        set({
          selectedExample: '',
          exampleSource: undefined,
          exampleClaim: undefined,
        });
        return;
      }

      const example = getExampleById(exampleId);
      if (example) {
        set({
          selectedExample: exampleId,
          exampleSource: example.sourceCode,
          exampleClaim: example.defaultClaim,
        });
      }
    },

    /**
     * Clear the selected example.
     */
    clearExample: () => {
      set(initialState);
    },
  }))
);

// Convenience selectors
export const useSelectedExample = () => useExampleStore((s) => s.selectedExample);
export const useExampleSource = () => useExampleStore((s) => s.exampleSource);
export const useExampleClaim = () => useExampleStore((s) => s.exampleClaim);
