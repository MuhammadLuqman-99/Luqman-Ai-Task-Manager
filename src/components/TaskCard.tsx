import { Task, TASK_TYPES, PRIORITIES } from '@/types';
import { useStore } from '@/stores/useStore';
import { CheckSquare, Clock, Play } from 'lucide-react';
import clsx from 'clsx';

// Format seconds to human readable
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent) => void;
  isDragging: boolean;
}

export function TaskCard({ task, onDragStart, isDragging }: TaskCardProps) {
  const { setEditingTask } = useStore();

  const taskType = TASK_TYPES.find((t) => t.id === task.taskType);
  const priority = PRIORITIES.find((p) => p.id === task.priority);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => setEditingTask(task)}
      className={clsx(
        'task-card bg-white dark:bg-slate-700 rounded-lg p-3 cursor-pointer border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all',
        isDragging && 'opacity-50 rotate-3'
      )}
    >
      {/* Header: Priority + Task ID + AI Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
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
        </div>
        {task.isAiLinked && (
          <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
            @ai
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-slate-800 dark:text-white text-sm mb-3 line-clamp-2">
        {task.title}
      </h3>

      {/* Subtasks indicator */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-500 dark:text-slate-400">
          <CheckSquare size={12} />
          <span>
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
          </span>
        </div>
      )}

      {/* Footer: Type + Progress + Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-xs font-medium rounded"
            style={{
              backgroundColor: `${taskType?.color}15`,
              color: taskType?.color,
            }}
          >
            {task.taskType}
          </span>

          {task.progress > 0 && (
            <span
              className={clsx(
                'px-2 py-0.5 text-xs font-medium rounded',
                task.progress === 100
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              )}
            >
              {task.progress}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Time tracking indicator */}
          {(task.totalTimeSpent && task.totalTimeSpent > 0) && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={12} />
              {formatTime(task.totalTimeSpent)}
            </span>
          )}

          {/* Timer running indicator */}
          {task.isTimerRunning && (
            <span className="flex items-center gap-1 text-xs text-green-500 animate-pulse">
              <Play size={12} fill="currentColor" />
            </span>
          )}

          {task.isAiLinked && (
            <span className="text-violet-500 dark:text-violet-400 text-sm">@ai</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {task.progress > 0 && task.progress < 100 && (
        <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      {task.progress === 100 && (
        <div className="mt-2 h-1 bg-green-500 rounded-full" />
      )}
    </div>
  );
}
