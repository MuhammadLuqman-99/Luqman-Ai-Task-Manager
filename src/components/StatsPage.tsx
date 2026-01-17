import { useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import {
  CheckCircle2, Clock, TrendingUp, AlertCircle,
  BarChart3, Activity, Target
} from 'lucide-react';
import { COLUMNS, TASK_TYPES, PRIORITIES, TaskStatus, TaskType, Priority } from '@/types';

export function StatsPage() {
  const { tasks, workspaces, selectedWorkspaceId } = useStore();

  const filteredTasks = useMemo(() => {
    if (selectedWorkspaceId) {
      return tasks.filter(t => t.workspaceId === selectedWorkspaceId);
    }
    return tasks;
  }, [tasks, selectedWorkspaceId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const byStatus: Record<TaskStatus, number> = {
      'BACKLOG': 0,
      'PLANNED': 0,
      'READY': 0,
      'IN_PROGRESS': 0,
      'TESTING': 0,
      'DONE': 0,
    };

    const byPriority: Record<Priority, number> = {
      1: 0,
      2: 0,
      3: 0,
    };

    const byType: Record<TaskType, number> = {
      'feat': 0,
      'bug': 0,
      'research': 0,
      'chore': 0,
    };

    let completedThisWeek = 0;
    let completedThisMonth = 0;
    let totalCompletionTime = 0;
    let completedCount = 0;

    filteredTasks.forEach(task => {
      byStatus[task.status]++;
      byPriority[task.priority]++;
      byType[task.taskType]++;

      if (task.status === 'DONE') {
        const updatedAt = new Date(task.updatedAt);
        const createdAt = new Date(task.createdAt);

        if (updatedAt >= startOfWeek) {
          completedThisWeek++;
        }
        if (updatedAt >= startOfMonth) {
          completedThisMonth++;
        }

        // Calculate completion time in hours
        const completionTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalCompletionTime += completionTime;
        completedCount++;
      }
    });

    const averageCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount : 0;

    return {
      total: filteredTasks.length,
      byStatus,
      byPriority,
      byType,
      completedThisWeek,
      completedThisMonth,
      averageCompletionTime,
      completedCount,
      inProgress: byStatus['IN_PROGRESS'] + byStatus['TESTING'],
      pending: byStatus['BACKLOG'] + byStatus['PLANNED'] + byStatus['READY'],
    };
  }, [filteredTasks]);

  // Calculate completion rate
  const completionRate = stats.total > 0 ? Math.round((stats.completedCount / stats.total) * 100) : 0;

  // Weekly progress data
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const completed = filteredTasks.filter(task => {
        const updatedAt = new Date(task.updatedAt);
        return task.status === 'DONE' && updatedAt >= date && updatedAt < nextDate;
      }).length;

      data.push({
        day: days[date.getDay()],
        completed,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    return data;
  }, [filteredTasks]);

  const maxWeeklyValue = Math.max(...weeklyData.map(d => d.completed), 1);

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Statistics</h1>
          <p className="text-slate-500">Track your productivity and task progress</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">Total Tasks</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <span className="text-sm text-slate-500">Completed</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.completedCount}</p>
            <p className="text-sm text-green-600">+{stats.completedThisWeek} this week</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Activity size={20} className="text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.inProgress}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Target size={20} className="text-violet-600" />
              </div>
              <span className="text-sm text-slate-500">Completion Rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{completionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Activity Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Weekly Activity</h3>
            <div className="flex items-end justify-between gap-2 h-40">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex flex-col items-center">
                    <span className="text-xs text-slate-500 mb-1">{day.completed}</span>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{
                        height: `${(day.completed / maxWeeklyValue) * 100}px`,
                        minHeight: day.completed > 0 ? '8px' : '2px',
                        backgroundColor: day.completed > 0 ? '#3b82f6' : '#e2e8f0',
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Status Distribution</h3>
            <div className="space-y-3">
              {COLUMNS.map(col => {
                const count = stats.byStatus[col.id];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={col.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <span>{col.icon}</span>
                        {col.title}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: col.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Priority Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">By Priority</h3>
            <div className="space-y-4">
              {PRIORITIES.map(p => {
                const count = stats.byPriority[p.id];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.label}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">
                          {p.id === 1 ? 'High' : p.id === 2 ? 'Medium' : 'Low'}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">By Type</h3>
            <div className="space-y-4">
              {TASK_TYPES.map(t => {
                const count = stats.byType[t.id];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.id.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{t.label}</span>
                        <span className="text-sm font-medium text-slate-800">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: t.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Clock size={18} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Avg. Completion Time</p>
                  <p className="text-lg font-bold text-slate-800">
                    {stats.averageCompletionTime > 24
                      ? `${Math.round(stats.averageCompletionTime / 24)} days`
                      : `${Math.round(stats.averageCompletionTime)} hours`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp size={18} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium text-slate-700">This Month</p>
                  <p className="text-lg font-bold text-green-600">
                    {stats.completedThisMonth} completed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertCircle size={18} className="text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Pending</p>
                  <p className="text-lg font-bold text-amber-600">
                    {stats.pending} tasks waiting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Stats (if multiple workspaces) */}
        {!selectedWorkspaceId && workspaces.length > 1 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Tasks by Workspace</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workspaces.map(workspace => (
                <div
                  key={workspace.id}
                  className="p-4 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: workspace.color }}
                    />
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {workspace.name}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{workspace.taskCount}</p>
                  <p className="text-xs text-slate-500">tasks</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
