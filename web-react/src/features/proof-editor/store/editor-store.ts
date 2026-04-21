import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const SAMPLE_SOURCE = `; Define addition function
(claim + (-> Nat Nat Nat))
(define +
  (lambda (n m)
    (rec-Nat n
      m
      (lambda (n-1 +n-1)
        (add1 +n-1)))))

; Prove that n = n for all Nat
(claim reflexivity
  (Pi ((n Nat))
    (= Nat n n)))
`;

export type SyncStatus = 'synced' | 'dirty' | 'syncing' | 'error';

export interface EditorState {
  editorValue: string;
  claimName: string;
  syncStatus: SyncStatus;
  dirtySinceLastSync: boolean;
  lastSyncError: string | null;
  lastGeneratedScript: string | null;
  hasUnsyncedConflict: boolean;
  /** Source lines before the define-tactically block; set on Sync/Start success. */
  preamble: string | null;
  /**
   * Callback registered by SourceCodePanel to surface the conflict modal.
   * When set, triggerConflictGuard will call it instead of running the action
   * directly when the editor has unsaved changes.
   */
  confirmConflictCallback: ((action: () => void) => void) | null;
}

export interface EditorActions {
  setEditorValue: (value: string) => void;
  setClaimName: (name: string) => void;
  markDirty: () => void;
  clearDirty: () => void;
  setGeneratedScript: (script: string | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setSyncError: (error: string | null) => void;
  setConflict: (hasConflict: boolean) => void;
  setPreamble: (preamble: string | null) => void;
  reset: () => void;
  /**
   * Register the conflict-modal callback from SourceCodePanel.
   * Call with `null` to unregister on unmount.
   */
  registerConflictCallback: (fn: ((action: () => void) => void) | null) => void;
  /**
   * Guard a canvas action against unsaved editor edits.
   * If the editor is dirty, surfaces the conflict modal via the registered
   * callback; otherwise runs `action` immediately.
   */
  triggerConflictGuard: (action: () => void) => void;
}

export interface EditorStore extends EditorState, EditorActions {}

const initialState: EditorState = {
  editorValue: SAMPLE_SOURCE,
  claimName: 'reflexivity',
  syncStatus: 'synced',
  dirtySinceLastSync: false,
  lastSyncError: null,
  lastGeneratedScript: null,
  hasUnsyncedConflict: false,
  preamble: null,
  confirmConflictCallback: null,
};

/**
 * Editor Store
 *
 * Manages the state of the Monaco editor and its synchronization
 * with the proof canvas. Kept separate from proof-store to avoid
 * circular dependencies and large performance hits during typing.
 */
export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      setEditorValue: (value: string) => {
        set((state) => {
          state.editorValue = value;
          state.dirtySinceLastSync = true;
          state.syncStatus = 'dirty';
        });
      },

      setClaimName: (name: string) => {
        set((state) => {
          state.claimName = name;
        });
      },

      markDirty: () => {
        set((state) => {
          state.dirtySinceLastSync = true;
          state.syncStatus = 'dirty';
        });
      },

      clearDirty: () => {
        set((state) => {
          state.dirtySinceLastSync = false;
          state.syncStatus = 'synced';
          state.lastSyncError = null;
          state.hasUnsyncedConflict = false;
        });
      },

      setGeneratedScript: (script: string | null) => {
        set((state) => {
          state.lastGeneratedScript = script;
        });
      },

      setSyncStatus: (status: SyncStatus) => {
        set((state) => {
          state.syncStatus = status;
        });
      },

      setSyncError: (error: string | null) => {
        set((state) => {
          state.lastSyncError = error;
          if (error) {
            state.syncStatus = 'error';
          }
        });
      },

      setConflict: (hasConflict: boolean) => {
        set((state) => {
          state.hasUnsyncedConflict = hasConflict;
        });
      },

      setPreamble: (preamble: string | null) => {
        set((state) => {
          state.preamble = preamble;
        });
      },

      registerConflictCallback: (fn) => {
        set((state) => {
          state.confirmConflictCallback = fn;
        });
      },

      triggerConflictGuard: (action) => {
        const { dirtySinceLastSync, confirmConflictCallback } = useEditorStore.getState();
        if (dirtySinceLastSync && confirmConflictCallback) {
          confirmConflictCallback(action);
        } else {
          action();
        }
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },
    }))
  )
);

// Selectors
export const useSyncStatus = () => useEditorStore((s) => s.syncStatus);
export const useDirtySinceLastSync = () => useEditorStore((s) => s.dirtySinceLastSync);
export const useEditorValue = () => useEditorStore((s) => s.editorValue);
export const useEditorClaimName = () => useEditorStore((s) => s.claimName);
