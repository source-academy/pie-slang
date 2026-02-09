import { useEffect } from 'react';
import { useProofStore } from '../store';
import { useHistoryStore } from '../store/history-store';

/**
 * Hook for handling keyboard shortcuts in the proof editor.
 *
 * Shortcuts:
 * - Ctrl/Cmd+Z: Undo
 * - Ctrl/Cmd+Shift+Z: Redo
 * - Ctrl/Cmd+Y: Redo (Windows convention)
 */
export function useKeyboardShortcuts() {
  const undo = useProofStore((s) => s.undo);
  const redo = useProofStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z or Cmd+Z (undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          console.log('[Keyboard] Undo triggered');
          undo();
        }
      }
      // Check for Ctrl+Shift+Z or Cmd+Shift+Z (redo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) {
          console.log('[Keyboard] Redo triggered');
          redo();
        }
      }
      // Also support Ctrl+Y for redo (Windows convention)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) {
          console.log('[Keyboard] Redo triggered (Ctrl+Y)');
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return { canUndo, canRedo };
}
