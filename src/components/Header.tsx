import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { Search, Plus, Trash2, Filter, ChevronDown, Folder, Moon, Sun } from 'lucide-react';
import { PageType } from '@/types';
import clsx from 'clsx';

const TABS: { id: PageType; label: string; icon: string }[] = [
  { id: 'tasks', label: 'Kanban', icon: '📋' },
  { id: 'plans', label: 'Plans', icon: '📝' },
  { id: 'rules', label: 'Rules', icon: '⚙️' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

export function Header() {
  const {
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspace,
    searchQuery,
    setSearchQuery,
    setShowNewTaskModal,
    setShowNewWorkspaceModal,
    setShowTrash,
    trash,
    fetchTrash,
    tasks,
    filterType,
    filterPriority,
    setFilterType,
    setFilterPriority,
    currentPage,
    setCurrentPage,
    darkMode,
    toggleDarkMode,
  } = useStore();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const totalTasks = selectedWorkspaceId
    ? tasks.length
    : workspaces.reduce((sum, w) => sum + w.taskCount, 0);

  useEffect(() => {
    fetchTrash();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Logo + New Task */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">Luqman AI</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm">Task Manager</span>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>

        {/* Center: Workspace Selector */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Folder size={18} className="text-amber-500" />
              <span className="font-medium dark:text-white">
                {selectedWorkspace?.name || 'All Workspaces'}
              </span>
              <span className="text-slate-500 dark:text-slate-400">({totalTasks})</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                <button
                  onClick={() => {
                    setSelectedWorkspace(null);
                    setShowWorkspaceDropdown(false);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-white',
                    !selectedWorkspaceId && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  )}
                >
                  <Folder size={18} className="text-slate-400" />
                  <span>All Workspaces</span>
                  <span className="ml-auto text-slate-400">
                    ({workspaces.reduce((sum, w) => sum + w.taskCount, 0)})
                  </span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-700 my-2" />

                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      setSelectedWorkspace(workspace.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-white',
                      selectedWorkspaceId === workspace.id && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: workspace.color }}
                    />
                    <span>{workspace.name}</span>
                    <span className="ml-auto text-slate-400">({workspace.taskCount})</span>
                    {selectedWorkspaceId === workspace.id && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-700 my-2" />

                <button
                  onClick={() => {
                    setShowNewWorkspaceModal(true);
                    setShowWorkspaceDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Plus size={18} />
                  <span>New Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right: Filters + Trash + Dark Mode */}
        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                filterType || filterPriority
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
              )}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Type</div>
                {['feat', 'bug', 'research', 'chore'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(filterType === type ? null : (type as any))}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white',
                      filterType === type && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    <span className="capitalize">{type}</span>
                    {filterType === type && <span className="ml-auto">✓</span>}
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-700 my-2" />

                <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Priority</div>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(filterPriority === p ? null : (p as any))}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white',
                      filterPriority === p && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    <span>P{p}</span>
                    {filterPriority === p && <span className="ml-auto">✓</span>}
                  </button>
                ))}

                {(filterType || filterPriority) && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-2" />
                    <button
                      onClick={() => {
                        setFilterType(null);
                        setFilterPriority(null);
                      }}
                      className="w-full px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      Clear Filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Moon size={18} className="text-slate-500" />
            )}
          </button>

          {/* Trash */}
          <button
            onClick={() => setShowTrash(true)}
            className="relative flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="text-slate-500 dark:text-slate-400" />
            <span className="dark:text-white">Trash</span>
            {trash.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {trash.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mt-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentPage(tab.id)}
            className={clsx(
              'flex items-center gap-2 pb-2 border-b-2 transition-colors',
              currentPage === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
