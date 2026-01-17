import { useStore } from '@/stores/useStore';
import { LayoutGrid, Calendar, Zap, BarChart3, Plus, ChevronDown, Folder } from 'lucide-react';
import { PageType } from '@/types';
import clsx from 'clsx';
import { useState } from 'react';

const NAV_ITEMS: { id: PageType; label: string; icon: React.ReactNode }[] = [
  { id: 'tasks', label: 'Tasks', icon: <LayoutGrid size={20} /> },
  { id: 'plans', label: 'Plans', icon: <Calendar size={20} /> },
  { id: 'rules', label: 'Rules', icon: <Zap size={20} /> },
  { id: 'stats', label: 'Stats', icon: <BarChart3 size={20} /> },
];

export function Sidebar() {
  const {
    currentPage,
    setCurrentPage,
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspace,
    setShowNewWorkspaceModal,
  } = useStore();

  const [showWorkspaces, setShowWorkspaces] = useState(true);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg">
            F
          </div>
          <div>
            <h1 className="font-bold text-lg">FlowTask</h1>
            <p className="text-xs text-slate-400">Task Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-3">Menu</p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        {/* Workspaces Section */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <button
            onClick={() => setShowWorkspaces(!showWorkspaces)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-xs uppercase tracking-wider">Workspaces</span>
            <ChevronDown
              size={16}
              className={clsx('transition-transform', showWorkspaces && 'rotate-180')}
            />
          </button>

          {showWorkspaces && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => setSelectedWorkspace(null)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                  selectedWorkspaceId === null
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Folder size={16} />
                <span>All Workspaces</span>
              </button>

              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setSelectedWorkspace(workspace.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                    selectedWorkspaceId === workspace.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: workspace.color }}
                  />
                  <span className="flex-1 text-left truncate">{workspace.name}</span>
                  <span className="text-xs text-slate-500">{workspace.taskCount}</span>
                </button>
              ))}

              <button
                onClick={() => setShowNewWorkspaceModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all text-sm"
              >
                <Plus size={16} />
                <span>Add Workspace</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          FlowTask v1.0.0
        </div>
      </div>
    </aside>
  );
}
