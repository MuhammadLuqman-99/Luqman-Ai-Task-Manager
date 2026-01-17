import { useState, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Plan } from '@/types';
import clsx from 'clsx';

const PLAN_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export function PlansPage() {
  const { tasks, plans, addPlan, deletePlan, selectedWorkspaceId } = useStore();
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // New plan form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newColor, setNewColor] = useState(PLAN_COLORS[0]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const filteredPlans = useMemo(() => {
    if (selectedWorkspaceId) {
      return plans.filter(p => p.workspaceId === selectedWorkspaceId);
    }
    return plans;
  }, [plans, selectedWorkspaceId]);

  const filteredTasks = useMemo(() => {
    if (selectedWorkspaceId) {
      return tasks.filter(t => t.workspaceId === selectedWorkspaceId);
    }
    return tasks;
  }, [tasks, selectedWorkspaceId]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const getPlansForDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return filteredPlans.filter(plan => {
      return dateStr >= plan.startDate && dateStr <= plan.endDate;
    });
  };

  const handleCreatePlan = async () => {
    if (!newTitle.trim() || !newStartDate || !newEndDate) return;

    await addPlan({
      title: newTitle,
      description: newDescription,
      workspaceId: selectedWorkspaceId || undefined,
      startDate: newStartDate,
      endDate: newEndDate,
      color: newColor,
      taskIds: selectedTaskIds,
    });

    setNewTitle('');
    setNewDescription('');
    setNewStartDate('');
    setNewEndDate('');
    setNewColor(PLAN_COLORS[0]);
    setSelectedTaskIds([]);
    setShowNewPlan(false);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getTaskProgress = (plan: Plan) => {
    if (plan.taskIds.length === 0) return 0;
    const planTasks = tasks.filter(t => plan.taskIds.includes(t.id));
    const completed = planTasks.filter(t => t.status === 'DONE').length;
    return Math.round((completed / planTasks.length) * 100);
  };

  return (
    <div className="h-full flex">
      {/* Main Calendar View */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Plans</h1>
            <p className="text-slate-500">Schedule and track your project timelines</p>
          </div>
          <button
            onClick={() => setShowNewPlan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            New Plan
          </button>
        </div>

        {/* Calendar Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-slate-500 border-b border-slate-200">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r border-slate-100 bg-slate-50" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const plansForDay = getPlansForDay(day);
              const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

              return (
                <div
                  key={day}
                  className={clsx(
                    'h-24 p-2 border-b border-r border-slate-100 hover:bg-slate-50 transition-colors',
                    isToday && 'bg-blue-50'
                  )}
                >
                  <span className={clsx(
                    'text-sm font-medium',
                    isToday ? 'text-blue-600' : 'text-slate-600'
                  )}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {plansForDay.slice(0, 2).map(plan => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                      >
                        {plan.title}
                      </div>
                    ))}
                    {plansForDay.length > 2 && (
                      <div className="text-xs text-slate-400">+{plansForDay.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plans List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map(plan => {
            const progress = getTaskProgress(plan);
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-xs text-slate-400">
                    {plan.taskIds.length} tasks
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{plan.title}</h3>
                {plan.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{plan.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <Calendar size={14} />
                  <span>{plan.startDate} - {plan.endDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: plan.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{progress}%</span>
                </div>
              </div>
            );
          })}

          {filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No plans yet. Create your first plan to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* New Plan Modal */}
      {showNewPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Create New Plan</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Sprint 1, Feature Launch, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Color</label>
                <div className="flex gap-2">
                  {PLAN_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={clsx(
                        'w-8 h-8 rounded-lg transition-transform',
                        newColor === color && 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Link Tasks</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredTasks.map(task => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700 truncate">{task.title}</span>
                      <span className="text-xs text-slate-400 ml-auto">{task.taskId}</span>
                    </label>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-sm">No tasks available</div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewPlan(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={!newTitle.trim() || !newStartDate || !newEndDate}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Detail Sidebar */}
      {selectedPlan && (
        <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Plan Details</h2>
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>

          <div
            className="w-full h-2 rounded-full mb-4"
            style={{ backgroundColor: selectedPlan.color }}
          />

          <h3 className="text-lg font-semibold text-slate-800 mb-2">{selectedPlan.title}</h3>
          {selectedPlan.description && (
            <p className="text-sm text-slate-500 mb-4">{selectedPlan.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Clock size={16} />
            <span>{selectedPlan.startDate} - {selectedPlan.endDate}</span>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Progress</span>
              <span className="text-sm text-slate-500">{getTaskProgress(selectedPlan)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${getTaskProgress(selectedPlan)}%`, backgroundColor: selectedPlan.color }}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-2">Linked Tasks ({selectedPlan.taskIds.length})</h4>
            <div className="space-y-2">
              {selectedPlan.taskIds.map(taskId => {
                const task = tasks.find(t => t.id === taskId);
                if (!task) return null;
                return (
                  <div key={taskId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    {task.status === 'DONE' ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <Circle size={16} className="text-slate-300" />
                    )}
                    <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              deletePlan(selectedPlan.id);
              setSelectedPlan(null);
            }}
            className="w-full mt-6 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete Plan
          </button>
        </div>
      )}
    </div>
  );
}
