import { useState, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { X, Trash2, Zap, Plus, Check, Clock, Play, Square, History } from 'lucide-react';
import { TASK_TYPES, PRIORITIES, COLUMNS, Priority, TaskStatus, Subtask, ActivityEntry } from '@/types';
import clsx from 'clsx';

// Format seconds to human readable
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Format date for activity log
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export function TaskDetailModal() {
  const { editingTask, setEditingTask, updateTask, deleteTask, workspaces } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('BACKLOG');
  const [priority, setPriority] = useState<Priority>(2);
  const [progress, setProgress] = useState(0);
  const [isAiLinked, setIsAiLinked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Time tracking state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);

  // Activity log state
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'time' | 'activity'>('details');

  // Initialize state when editingTask changes
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setProgress(editingTask.progress);
      setIsAiLinked(editingTask.isAiLinked);
      setSubtasks(editingTask.subtasks || []);
      setTotalTimeSpent(editingTask.totalTimeSpent || 0);
      setIsTimerRunning(editingTask.isTimerRunning || false);
      setActivities(editingTask.activities || []);
    }
  }, [editingTask]);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - timerStartTime.getTime()) / 1000);
        setCurrentSessionTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  if (!editingTask) return null;

  const workspace = workspaces.find((w) => w.id === editingTask.workspaceId);
  const taskType = TASK_TYPES.find((t) => t.id === editingTask.taskType);

  const addActivity = (action: ActivityEntry['action'], description: string, oldValue?: string, newValue?: string) => {
    const newActivity: ActivityEntry = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      description,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Add activity if status changed
      if (status !== editingTask.status) {
        addActivity('status_changed', `Status changed`, editingTask.status, status);
      }

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

  // Subtask functions
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setSubtasks(prev => [...prev, subtask]);
    addActivity('subtask_added', `Added subtask: ${subtask.title}`);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(s => {
      if (s.id === id) {
        const newCompleted = !s.completed;
        if (newCompleted) {
          addActivity('subtask_completed', `Completed: ${s.title}`);
        }
        return { ...s, completed: newCompleted };
      }
      return s;
    }));

    // Update progress based on subtasks
    const updated = subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    const completed = updated.filter(s => s.completed).length;
    const total = updated.length;
    if (total > 0) {
      setProgress(Math.round((completed / total) * 100));
    }
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  // Timer functions
  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
    setCurrentSessionTime(0);
    addActivity('time_logged', 'Started timer');
  };

  const stopTimer = () => {
    if (timerStartTime) {
      const elapsed = Math.floor((new Date().getTime() - timerStartTime.getTime()) / 1000);
      setTotalTimeSpent(prev => prev + elapsed);
      addActivity('time_logged', `Logged ${formatTime(elapsed)}`);
    }
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setCurrentSessionTime(0);
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
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
              <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: workspace.color }} />
                {workspace.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setEditingTask(null)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
          {[
            { id: 'details', label: 'Details', icon: null },
            { id: 'subtasks', label: `Subtasks (${completedSubtasks}/${subtasks.length})`, icon: Check },
            { id: 'time', label: formatTime(totalTimeSpent + currentSessionTime), icon: Clock },
            { id: 'activity', label: 'Activity', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-semibold text-slate-800 dark:text-white bg-transparent border-0 border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-2"
                placeholder="Task title"
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setStatus(col.id)}
                      className={clsx(
                        'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                        status === col.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-600 dark:text-slate-300 hover:border-slate-300'
                      )}
                    >
                      {col.icon} {col.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={clsx(
                        'px-4 py-2 text-sm rounded-lg border font-medium transition-colors',
                        priority === p.id ? 'ring-2 ring-offset-1 dark:ring-offset-slate-800' : 'border-slate-200 dark:border-slate-600 dark:text-slate-300 hover:border-slate-300'
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
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Progress: {progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* AI Linked */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Zap size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 dark:text-white">AI Integration</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Mark this task as AI-assisted</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiLinked(!isAiLinked)}
                  className={clsx(
                    'relative w-12 h-6 rounded-full transition-colors',
                    isAiLinked ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'
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
            </div>
          )}

          {/* Subtasks Tab */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4">
              {/* Add subtask */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add a subtask..."
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addSubtask}
                  disabled={!newSubtask.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Subtasks list */}
              <div className="space-y-2">
                {subtasks.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 py-8">No subtasks yet</p>
                ) : (
                  subtasks.map(subtask => (
                    <div
                      key={subtask.id}
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        subtask.completed
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                      )}
                    >
                      <button
                        onClick={() => toggleSubtask(subtask.id)}
                        className={clsx(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          subtask.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 dark:border-slate-500 hover:border-green-500'
                        )}
                      >
                        {subtask.completed && <Check size={12} />}
                      </button>
                      <span className={clsx(
                        'flex-1 dark:text-white',
                        subtask.completed && 'line-through text-slate-400 dark:text-slate-500'
                      )}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(subtask.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Time Tracking Tab */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              {/* Timer display */}
              <div className="text-center py-8">
                <div className="text-5xl font-mono font-bold text-slate-800 dark:text-white mb-4">
                  {formatTime(totalTimeSpent + currentSessionTime)}
                </div>
                {isTimerRunning && (
                  <p className="text-green-500 animate-pulse mb-4">Timer running...</p>
                )}
                <div className="flex justify-center gap-4">
                  {!isTimerRunning ? (
                    <button
                      onClick={startTimer}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Play size={20} />
                      Start Timer
                    </button>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Square size={20} />
                      Stop Timer
                    </button>
                  )}
                </div>
              </div>

              {/* Time summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(totalTimeSpent)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Time</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(currentSessionTime)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current Session</p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-500 py-8">No activity yet</p>
              ) : (
                activities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <History size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{activity.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Updated: {new Date(editingTask.updatedAt).toLocaleString()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
    </div>
  );
}
