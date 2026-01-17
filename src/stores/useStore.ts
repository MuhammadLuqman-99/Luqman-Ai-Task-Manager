import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import { Task, Workspace, TaskStatus, TaskType, Priority, PageType, Plan, Rule, RuleTrigger, RuleAction } from '@/types';

interface AppState {
  // Data
  tasks: Task[];
  workspaces: Workspace[];
  trash: Task[];
  plans: Plan[];
  rules: Rule[];

  // UI State
  currentPage: PageType;
  selectedWorkspaceId: string | null;
  searchQuery: string;
  isLoading: boolean;
  showTrash: boolean;
  showNewTaskModal: boolean;
  showNewWorkspaceModal: boolean;
  editingTask: Task | null;
  darkMode: boolean;

  // Filters
  filterType: TaskType | null;
  filterPriority: Priority | null;
  filterAiLinked: boolean;

  // Navigation
  setCurrentPage: (page: PageType) => void;

  // Theme
  toggleDarkMode: () => void;

  // Actions
  setSelectedWorkspace: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowTrash: (show: boolean) => void;
  setShowNewTaskModal: (show: boolean) => void;
  setShowNewWorkspaceModal: (show: boolean) => void;
  setEditingTask: (task: Task | null) => void;
  setFilterType: (type: TaskType | null) => void;
  setFilterPriority: (priority: Priority | null) => void;
  setFilterAiLinked: (linked: boolean) => void;

  // Data Actions
  fetchWorkspaces: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchTrash: () => Promise<void>;
  createWorkspace: (name: string, color: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string, permanent?: boolean) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  searchTasks: (query: string) => Promise<void>;

  // Plan Actions
  addPlan: (data: CreatePlanData) => Promise<void>;
  updatePlan: (id: string, data: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => void;

  // Rule Actions
  addRule: (data: CreateRuleData) => Promise<void>;
  updateRule: (id: string, data: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

interface CreateTaskData {
  title: string;
  description?: string;
  taskType: TaskType;
  priority: Priority;
  workspaceId?: string;
  status?: TaskStatus;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  progress?: number;
  isAiLinked?: boolean;
}

interface CreatePlanData {
  title: string;
  description?: string;
  workspaceId?: string;
  startDate: string;
  endDate: string;
  color: string;
  taskIds: string[];
}

interface CreateRuleData {
  name: string;
  description?: string;
  workspaceId?: string;
  trigger: RuleTrigger;
  triggerValue?: string;
  action: RuleAction;
  actionValue: string;
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: [],
      workspaces: [],
      trash: [],
      plans: [],
      rules: [],
      currentPage: 'tasks',
      selectedWorkspaceId: null,
      searchQuery: '',
      isLoading: false,
      showTrash: false,
      showNewTaskModal: false,
      showNewWorkspaceModal: false,
      editingTask: null,
      darkMode: false,
      filterType: null,
      filterPriority: null,
      filterAiLinked: false,

      // Navigation
      setCurrentPage: (page) => set({ currentPage: page }),

      // Theme
      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newDarkMode };
        });
      },

      // UI Actions
      setSelectedWorkspace: (id) => {
        set({ selectedWorkspaceId: id });
        get().fetchTasks();
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowTrash: (show) => set({ showTrash: show }),
      setShowNewTaskModal: (show) => set({ showNewTaskModal: show }),
      setShowNewWorkspaceModal: (show) => set({ showNewWorkspaceModal: show }),
      setEditingTask: (task) => set({ editingTask: task }),
      setFilterType: (type) => set({ filterType: type }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      setFilterAiLinked: (linked) => set({ filterAiLinked: linked }),

      // Data Actions
      fetchWorkspaces: async () => {
        try {
          const workspaces = await invoke<Workspace[]>('get_workspaces');
          set({ workspaces });
          // Auto-select first workspace if none selected
          if (!get().selectedWorkspaceId && workspaces.length > 0) {
            set({ selectedWorkspaceId: workspaces[0].id });
          }
        } catch (error) {
          console.error('Failed to fetch workspaces:', error);
        }
      },

      fetchTasks: async () => {
        set({ isLoading: true });
        try {
          const { selectedWorkspaceId } = get();
          const tasks = await invoke<Task[]>('get_tasks', {
            workspaceId: selectedWorkspaceId,
            includeDeleted: false,
          });
          set({ tasks, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
          set({ isLoading: false });
        }
      },

      fetchTrash: async () => {
        try {
          const trash = await invoke<Task[]>('get_trash');
          set({ trash });
        } catch (error) {
          console.error('Failed to fetch trash:', error);
        }
      },

      createWorkspace: async (name, color) => {
        try {
          await invoke('create_workspace', { name, color });
          await get().fetchWorkspaces();
        } catch (error) {
          console.error('Failed to create workspace:', error);
          throw error;
        }
      },

      deleteWorkspace: async (id) => {
        try {
          await invoke('delete_workspace', { id });
          await get().fetchWorkspaces();
          if (get().selectedWorkspaceId === id) {
            const workspaces = get().workspaces;
            set({ selectedWorkspaceId: workspaces[0]?.id || null });
          }
        } catch (error) {
          console.error('Failed to delete workspace:', error);
          throw error;
        }
      },

      createTask: async (data) => {
        try {
          await invoke('create_task', {
            title: data.title,
            description: data.description || null,
            taskType: data.taskType,
            priority: data.priority,
            workspaceId: data.workspaceId || get().selectedWorkspaceId,
            status: data.status || 'BACKLOG',
          });
          await get().fetchTasks();
          await get().fetchWorkspaces();
        } catch (error) {
          console.error('Failed to create task:', error);
          throw error;
        }
      },

      updateTask: async (id, data) => {
        try {
          await invoke('update_task', {
            id,
            title: data.title || null,
            description: data.description || null,
            status: data.status || null,
            priority: data.priority || null,
            progress: data.progress ?? null,
            isAiLinked: data.isAiLinked ?? null,
          });
          await get().fetchTasks();
        } catch (error) {
          console.error('Failed to update task:', error);
          throw error;
        }
      },

      updateTaskStatus: async (id, status) => {
        try {
          await invoke('update_task_status', { id, status });
          await get().fetchTasks();
        } catch (error) {
          console.error('Failed to update task status:', error);
          throw error;
        }
      },

      deleteTask: async (id, permanent = false) => {
        try {
          await invoke('delete_task', { id, permanent });
          await get().fetchTasks();
          await get().fetchWorkspaces();
          if (get().showTrash) {
            await get().fetchTrash();
          }
        } catch (error) {
          console.error('Failed to delete task:', error);
          throw error;
        }
      },

      restoreTask: async (id) => {
        try {
          await invoke('restore_task', { id });
          await get().fetchTrash();
          await get().fetchTasks();
          await get().fetchWorkspaces();
        } catch (error) {
          console.error('Failed to restore task:', error);
          throw error;
        }
      },

      emptyTrash: async () => {
        try {
          await invoke('empty_trash');
          await get().fetchTrash();
        } catch (error) {
          console.error('Failed to empty trash:', error);
          throw error;
        }
      },

      searchTasks: async (query) => {
        if (!query.trim()) {
          await get().fetchTasks();
          return;
        }
        try {
          const tasks = await invoke<Task[]>('search_tasks', { query });
          set({ tasks });
        } catch (error) {
          console.error('Failed to search tasks:', error);
        }
      },

      // Plan Actions (stored locally for now)
      addPlan: async (data) => {
        const now = new Date().toISOString();
        const newPlan: Plan = {
          id: generateId(),
          title: data.title,
          description: data.description,
          workspaceId: data.workspaceId,
          startDate: data.startDate,
          endDate: data.endDate,
          color: data.color,
          taskIds: data.taskIds,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ plans: [...state.plans, newPlan] }));
      },

      updatePlan: async (id, data) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === id
              ? { ...plan, ...data, updatedAt: new Date().toISOString() }
              : plan
          ),
        }));
      },

      deletePlan: (id) => {
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== id),
        }));
      },

      // Rule Actions (stored locally for now)
      addRule: async (data) => {
        const now = new Date().toISOString();
        const newRule: Rule = {
          id: generateId(),
          name: data.name,
          description: data.description,
          workspaceId: data.workspaceId,
          isActive: true,
          trigger: data.trigger,
          triggerValue: data.triggerValue,
          action: data.action,
          actionValue: data.actionValue,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ rules: [...state.rules, newRule] }));
      },

      updateRule: async (id, data) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id
              ? { ...rule, ...data, updatedAt: new Date().toISOString() }
              : rule
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        }));
      },

      toggleRule: (id) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id
              ? { ...rule, isActive: !rule.isActive, updatedAt: new Date().toISOString() }
              : rule
          ),
        }));
      },
    }),
    {
      name: 'luqman-task-manager-storage',
      partialize: (state) => ({
        plans: state.plans,
        rules: state.rules,
        currentPage: state.currentPage,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply dark mode class on app load
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
