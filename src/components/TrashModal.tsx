import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import { TASK_TYPES, PRIORITIES } from '@/types';

export function TrashModal() {
  const { setShowTrash, trash, fetchTrash, restoreTask, deleteTask, emptyTrash } = useStore();

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string) => {
    await restoreTask(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this task? This cannot be undone.')) {
      await deleteTask(id, true);
    }
  };

  const handleEmptyTrash = async () => {
    if (confirm('Empty trash? All tasks will be permanently deleted.')) {
      await emptyTrash();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Trash2 className="text-slate-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Trash</h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full">
              {trash.length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            {trash.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                Empty Trash
              </button>
            )}
            <button
              onClick={() => setShowTrash(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {trash.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Trash2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Trash is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trash.map((task) => {
                const taskType = TASK_TYPES.find((t) => t.id === task.taskType);
                const priority = PRIORITIES.find((p) => p.id === task.priority);

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="px-1.5 py-0.5 text-xs font-semibold rounded"
                        style={{
                          backgroundColor: `${priority?.color}20`,
                          color: priority?.color,
                        }}
                      >
                        P{task.priority}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{task.taskId}</span>
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${taskType?.color}15`,
                          color: taskType?.color,
                        }}
                      >
                        {task.taskType}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestore(task.id)}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                        title="Restore"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg transition-colors"
                        title="Delete permanently"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
