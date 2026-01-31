import { useUIStore, useDeleteConfirmation } from '../../store/ui-store';

/**
 * DeleteConfirmModal Component
 *
 * Modal dialog for confirming tactic deletion.
 * Reads delete confirmation state from ui-store and
 * calls confirmDelete() or cancelDelete() based on user action.
 */
export function DeleteConfirmModal() {
  const deleteConfirmation = useDeleteConfirmation();
  const confirmDelete = useUIStore((s) => s.confirmDelete);
  const cancelDelete = useUIStore((s) => s.cancelDelete);

  // Don't render if there's no pending deletion
  if (!deleteConfirmation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Delete Tactic?
        </h2>
        <p className="mb-6 text-gray-600">
          This will delete the tactic and all its child goals. The parent goal
          will be reverted to &quot;pending&quot; status. This action can be undone
          with Ctrl+Z.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={cancelDelete}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
