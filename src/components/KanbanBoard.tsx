import { useStore } from '@/stores/useStore';
import { COLUMNS, Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

export function KanbanBoard() {
  const { tasks, isLoading, filterType, filterPriority, searchQuery, updateTaskStatus } = useStore();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterType && task.taskType !== filterType) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.taskId.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredTasks.filter((t) => t.status === col.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== columnId) {
      await updateTaskStatus(draggedTask.id, columnId);
    }
    setDraggedTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-x-auto">
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
        <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
      </div>

      <div className="flex gap-4 h-[calc(100%-2rem)]">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={clsx(
              'flex-1 min-w-[280px] max-w-[320px] flex flex-col bg-slate-100 rounded-xl',
              dragOverColumn === column.id && 'ring-2 ring-blue-400 bg-blue-50'
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{column.icon}</span>
                <span className="font-semibold text-slate-700">{column.title}</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-sm rounded-full">
                  {tasksByStatus[column.id]?.length || 0}
                </span>
              </div>
              <button className="p-1 hover:bg-slate-200 rounded transition-colors">
                <Plus size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 kanban-column space-y-2">
              {tasksByStatus[column.id]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={(e) => handleDragStart(e, task)}
                  isDragging={draggedTask?.id === task.id}
                />
              ))}

              {tasksByStatus[column.id]?.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
