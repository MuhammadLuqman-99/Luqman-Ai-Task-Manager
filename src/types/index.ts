export type TaskStatus = 'BACKLOG' | 'PLANNED' | 'READY' | 'IN_PROGRESS' | 'TESTING' | 'DONE';
export type TaskType = 'feat' | 'bug' | 'research' | 'chore';
export type Priority = 1 | 2 | 3;

// Subtask
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// Time Entry for time tracking
export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
}

// Activity Log Entry
export interface ActivityEntry {
  id: string;
  action: 'created' | 'updated' | 'status_changed' | 'completed' | 'time_logged' | 'subtask_added' | 'subtask_completed';
  description: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  taskType: TaskType;
  workspaceId?: string;
  tags: string[];
  progress: number;
  isAiLinked: boolean;
  createdAt: string;
  updatedAt: string;
  // New fields
  subtasks?: Subtask[];
  timeEntries?: TimeEntry[];
  totalTimeSpent?: number; // in seconds
  isTimerRunning?: boolean;
  activities?: ActivityEntry[];
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  icon?: string;
  taskCount: number;
  createdAt: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  icon: string;
  color: string;
}

export const COLUMNS: Column[] = [
  { id: 'BACKLOG', title: 'Backlog', icon: '📋', color: '#64748b' },
  { id: 'PLANNED', title: 'Planned', icon: '📝', color: '#8b5cf6' },
  { id: 'READY', title: 'Ready', icon: '🎯', color: '#f59e0b' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: '🔧', color: '#3b82f6' },
  { id: 'TESTING', title: 'Testing', icon: '🧪', color: '#ec4899' },
  { id: 'DONE', title: 'Done', icon: '✅', color: '#10b981' },
];

export const TASK_TYPES: { id: TaskType; label: string; color: string }[] = [
  { id: 'feat', label: 'Feature', color: '#3b82f6' },
  { id: 'bug', label: 'Bug', color: '#ef4444' },
  { id: 'research', label: 'Research', color: '#8b5cf6' },
  { id: 'chore', label: 'Chore', color: '#64748b' },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 1, label: 'P1', color: '#ef4444' },
  { id: 2, label: 'P2', color: '#f59e0b' },
  { id: 3, label: 'P3', color: '#10b981' },
];

// Navigation
export type PageType = 'tasks' | 'plans' | 'rules' | 'stats';

// Plans
export interface Plan {
  id: string;
  title: string;
  description?: string;
  workspaceId?: string;
  startDate: string;
  endDate: string;
  color: string;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Rules (Automation)
export type RuleTrigger = 'status_change' | 'priority_change' | 'due_date' | 'created' | 'assigned';
export type RuleAction = 'move_to_status' | 'set_priority' | 'add_tag' | 'notify';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  workspaceId?: string;
  isActive: boolean;
  trigger: RuleTrigger;
  triggerValue?: string;
  action: RuleAction;
  actionValue: string;
  createdAt: string;
  updatedAt: string;
}

export const RULE_TRIGGERS: { id: RuleTrigger; label: string; icon: string }[] = [
  { id: 'status_change', label: 'Status Changed', icon: '🔄' },
  { id: 'priority_change', label: 'Priority Changed', icon: '⚡' },
  { id: 'due_date', label: 'Due Date Reached', icon: '📅' },
  { id: 'created', label: 'Task Created', icon: '✨' },
  { id: 'assigned', label: 'Task Assigned', icon: '👤' },
];

export const RULE_ACTIONS: { id: RuleAction; label: string; icon: string }[] = [
  { id: 'move_to_status', label: 'Move to Status', icon: '➡️' },
  { id: 'set_priority', label: 'Set Priority', icon: '🎯' },
  { id: 'add_tag', label: 'Add Tag', icon: '🏷️' },
  { id: 'notify', label: 'Send Notification', icon: '🔔' },
];

// Stats
export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
  byType: Record<TaskType, number>;
  completedThisWeek: number;
  completedThisMonth: number;
  averageCompletionTime: number;
}
