import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type SyncStatus = 'synced' | 'code-edited' | 'syncing' | 'sync-failed';

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
  setPreamble: (preamble: string) => void;
  reset: () => void;
}

export interface EditorStore extends EditorState, EditorActions {}

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

const initialState: EditorState = {
  editorValue: SAMPLE_SOURCE,
  claimName: 'reflexivity',
  syncStatus: 'synced',
  dirtySinceLastSync: false,
  lastSyncError: null,
  lastGeneratedScript: null,
  hasUnsyncedConflict: false,
  preamble: null,
};

/**
 * Editor Store
 *
 * Manages the Monaco editor state, sync status, and the relationship
 * between source code and the proof canvas.
 *
 * Sync model:
 * - Canvas is the runtime source of truth.
 * - Code edits are tracked as "dirty" and do not affect canvas until
 *   "Sync to Canvas" is explicitly triggered.
 * - Canvas structural changes auto-generate a script (read-only display).
 * - Undo/redo for the editor is handled by Monaco's native stack.
 */
export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      setEditorValue: (value: string) => {
        set((state) => {
          state.editorValue = value;
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
          state.syncStatus = 'code-edited';
        });
      },

      clearDirty: () => {
        set((state) => {
          state.dirtySinceLastSync = false;
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
        });
      },

      setConflict: (hasConflict: boolean) => {
        set((state) => {
          state.hasUnsyncedConflict = hasConflict;
        });
      },

      setPreamble: (preamble: string) => {
        set((state) => {
          state.preamble = preamble;
        });
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },
    }))
  )
);

// Convenience selectors
export const useSyncStatus = () => useEditorStore((s) => s.syncStatus);
export const useDirtySinceLastSync = () => useEditorStore((s) => s.dirtySinceLastSync);
export const useEditorValue = () => useEditorStore((s) => s.editorValue);
export const useEditorClaimName = () => useEditorStore((s) => s.claimName);
