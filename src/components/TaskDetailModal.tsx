import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { X, Trash2, Zap } from 'lucide-react';
import { TASK_TYPES, PRIORITIES, COLUMNS, Priority, TaskStatus } from '@/types';
import clsx from 'clsx';

export function TaskDetailModal() {
  const { editingTask, setEditingTask, updateTask, deleteTask, workspaces } = useStore();

  if (!editingTask) return null;

  const [title, setTitle] = useState(editingTask.title);
  const [description, setDescription] = useState(editingTask.description || '');
  const [status, setStatus] = useState<TaskStatus>(editingTask.status);
  const [priority, setPriority] = useState<Priority>(editingTask.priority);
  const [progress, setProgress] = useState(editingTask.progress);
  const [isAiLinked, setIsAiLinked] = useState(editingTask.isAiLinked);
  const [isSaving, setIsSaving] = useState(false);

  const workspace = workspaces.find((w) => w.id === editingTask.workspaceId);
  const taskType = TASK_TYPES.find((t) => t.id === editingTask.taskType);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTask(editingTask.id, {
        title,
        description,
        status,
        priority,
        progress,
        isAiLinked,
      });
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Move this task to trash?')) {
      await deleteTask(editingTask.id);
      setEditingTask(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span
              className="px-2 py-1 text-sm font-semibold rounded"
              style={{
                backgroundColor: `${taskType?.color}15`,
                color: taskType?.color,
              }}
            >
              {editingTask.taskId}
            </span>
            {workspace && (
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: workspace.color }} />
                {workspace.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setEditingTask(null)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-semibold text-slate-800 border-0 border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-2"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a description..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setStatus(col.id)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                    status === col.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {col.icon} {col.title}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={clsx(
                    'px-4 py-2 text-sm rounded-lg border font-medium transition-colors',
                    priority === p.id ? 'ring-2 ring-offset-1' : 'border-slate-200 hover:border-slate-300'
                  )}
                  style={
                    priority === p.id
                      ? { borderColor: p.color, backgroundColor: `${p.color}10`, color: p.color, '--tw-ring-color': p.color } as any
                      : {}
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* AI Linked */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Zap size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">AI Integration</p>
                <p className="text-sm text-slate-500">Mark this task as AI-assisted</p>
              </div>
            </div>
            <button
              onClick={() => setIsAiLinked(!isAiLinked)}
              className={clsx(
                'relative w-12 h-6 rounded-full transition-colors',
                isAiLinked ? 'bg-violet-500' : 'bg-slate-300'
              )}
            >
              <div
                className={clsx(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  isAiLinked ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>Created: {new Date(editingTask.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(editingTask.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={() => setEditingTask(null)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
