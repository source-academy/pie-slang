import { useEffect } from 'react';
import { useProofStore } from '../store';
import { useHistoryStore } from '../store/history-store';

/**
 * Returns true when the keyboard event's focus is inside a Monaco editor.
 * Monaco mounts with the class `.monaco-editor` on the container.
 */
function isMonacoFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  return active.closest('.monaco-editor') !== null;
}

/**
 * Hook for handling keyboard shortcuts in the proof editor.
 *
 * Undo/redo routing:
 * - If Monaco editor is focused → let Monaco handle text undo/redo natively.
 * - Otherwise → canvas undo/redo (history-store / proof-store).
 *
 * Shortcuts:
 * - Ctrl/Cmd+Z: Canvas undo (when Monaco is NOT focused)
 * - Ctrl/Cmd+Shift+Z: Canvas redo (when Monaco is NOT focused)
 * - Ctrl/Cmd+Y: Canvas redo (Windows convention, when Monaco is NOT focused)
 */
export function useKeyboardShortcuts() {
  const undo = useProofStore((s) => s.undo);
  const redo = useProofStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo =
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y');

      if (!isUndo && !isRedo) return;

      // If focus is inside Monaco, let Monaco's native undo/redo run.
      if (isMonacoFocused()) return;

      if (isUndo) {
        e.preventDefault();
        if (canUndo()) {
          console.log('[Keyboard] Canvas undo triggered');
          undo();
        }
      } else if (isRedo) {
        e.preventDefault();
        if (canRedo()) {
          console.log('[Keyboard] Canvas redo triggered');
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return { canUndo, canRedo };
}
