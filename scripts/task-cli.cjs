#!/usr/bin/env node
/**
 * FlowTask CLI - Allows Claude to manage tasks directly
 * Usage:
 *   node task-cli.cjs add "Task title" --type feat --priority 1 --status BACKLOG
 *   node task-cli.cjs update <id> --status IN_PROGRESS --progress 50
 *   node task-cli.cjs list
 *   node task-cli.cjs complete <id>
 *   node task-cli.cjs delete <id>
 */

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Database path (same as Tauri app)
const dbPath = path.join(os.homedir(), 'AppData', 'Local', 'flowtask', 'flowtask.db');

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error('Error opening database:', err.message);
  process.exit(1);
}

// Generate task ID
function generateTaskId(taskType) {
  const suffix = uuidv4().substring(0, 4);
  return `${taskType}-${suffix}`;
}

// Get current timestamp
function now() {
  return new Date().toISOString();
}

// Commands
const commands = {
  add: (args) => {
    const title = args._[1];
    if (!title) {
      console.error('Error: Title is required');
      return;
    }

    const id = uuidv4();
    const taskType = args.type || 'feat';
    const taskId = generateTaskId(taskType);
    const priority = args.priority || 2;
    const status = args.status || 'BACKLOG';
    const description = args.description || args.desc || null;
    const workspaceId = args.workspace || null;
    const timestamp = now();

    try {
      const stmt = db.prepare(`
        INSERT INTO tasks (id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, is_deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, 1, 0, ?, ?)
      `);
      stmt.run(id, taskId, title, description, status, priority, taskType, workspaceId, timestamp, timestamp);

      console.log(`Task created successfully!`);
      console.log(`   ID: ${taskId}`);
      console.log(`   Title: ${title}`);
      console.log(`   Type: ${taskType}`);
      console.log(`   Priority: P${priority}`);
      console.log(`   Status: ${status}`);
    } catch (err) {
      console.error('Error creating task:', err.message);
    }
  },

  update: (args) => {
    const taskId = args._[1];
    if (!taskId) {
      console.error('Error: Task ID is required');
      return;
    }

    const updates = [];
    const params = [];

    if (args.title) {
      updates.push('title = ?');
      params.push(args.title);
    }
    if (args.description || args.desc) {
      updates.push('description = ?');
      params.push(args.description || args.desc);
    }
    if (args.status) {
      updates.push('status = ?');
      params.push(args.status.toUpperCase());
    }
    if (args.priority) {
      updates.push('priority = ?');
      params.push(args.priority);
    }
    if (args.progress !== undefined) {
      updates.push('progress = ?');
      params.push(args.progress);
    }

    if (updates.length === 0) {
      console.error('Error: No updates specified');
      return;
    }

    updates.push('updated_at = ?');
    params.push(now());
    params.push(taskId);

    try {
      const stmt = db.prepare(`
        UPDATE tasks SET ${updates.join(', ')}
        WHERE task_id = ? OR id = ?
      `);
      params.push(taskId); // for the second condition
      const result = stmt.run(...params);

      if (result.changes > 0) {
        console.log(`Task ${taskId} updated successfully!`);
        if (args.status) console.log(`   Status: ${args.status.toUpperCase()}`);
        if (args.progress !== undefined) console.log(`   Progress: ${args.progress}%`);
        if (args.priority) console.log(`   Priority: P${args.priority}`);
      } else {
        console.error(`Task ${taskId} not found`);
      }
    } catch (err) {
      console.error('Error updating task:', err.message);
    }
  },

  complete: (args) => {
    const taskId = args._[1];
    if (!taskId) {
      console.error('Error: Task ID is required');
      return;
    }

    try {
      const stmt = db.prepare(`
        UPDATE tasks SET status = 'DONE', progress = 100, updated_at = ?
        WHERE task_id = ? OR id = ?
      `);
      const result = stmt.run(now(), taskId, taskId);

      if (result.changes > 0) {
        console.log(`Task ${taskId} marked as DONE!`);
      } else {
        console.error(`Task ${taskId} not found`);
      }
    } catch (err) {
      console.error('Error completing task:', err.message);
    }
  },

  list: (args) => {
    const status = args.status;
    const limit = args.limit || 20;

    try {
      let sql = 'SELECT task_id, title, status, priority, task_type, progress FROM tasks WHERE is_deleted = 0';
      const params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status.toUpperCase());
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const stmt = db.prepare(sql);
      const tasks = stmt.all(...params);

      if (tasks.length === 0) {
        console.log('No tasks found');
        return;
      }

      console.log('\nTasks:');
      console.log('--------------------------------------------------------------------------------');
      tasks.forEach(task => {
        const statusIcon = {
          'BACKLOG': '[BACKLOG]',
          'PLANNED': '[PLANNED]',
          'READY': '[READY]',
          'IN_PROGRESS': '[IN_PROGRESS]',
          'TESTING': '[TESTING]',
          'DONE': '[DONE]'
        }[task.status] || '[?]';

        console.log(`${statusIcon} [${task.task_id}] ${task.title}`);
        console.log(`   Type: ${task.task_type} | Priority: P${task.priority} | Progress: ${task.progress}% | Status: ${task.status}`);
      });
      console.log('--------------------------------------------------------------------------------');
      console.log(`Total: ${tasks.length} tasks\n`);
    } catch (err) {
      console.error('Error listing tasks:', err.message);
    }
  },

  delete: (args) => {
    const taskId = args._[1];
    if (!taskId) {
      console.error('Error: Task ID is required');
      return;
    }

    try {
      const stmt = db.prepare(`
        UPDATE tasks SET is_deleted = 1, updated_at = ?
        WHERE task_id = ? OR id = ?
      `);
      const result = stmt.run(now(), taskId, taskId);

      if (result.changes > 0) {
        console.log(`Task ${taskId} moved to trash`);
      } else {
        console.error(`Task ${taskId} not found`);
      }
    } catch (err) {
      console.error('Error deleting task:', err.message);
    }
  },

  workspaces: () => {
    try {
      const stmt = db.prepare('SELECT id, name, color FROM workspaces ORDER BY name');
      const workspaces = stmt.all();

      console.log('\nWorkspaces:');
      workspaces.forEach(ws => {
        console.log(`   [${ws.id.substring(0, 8)}] ${ws.name}`);
      });
      console.log('');
    } catch (err) {
      console.error('Error listing workspaces:', err.message);
    }
  },

  help: () => {
    console.log(`
FlowTask CLI - Manage tasks from command line

Commands:
  add <title>           Create a new task
    --type <type>       Task type: feat, bug, research, chore (default: feat)
    --priority <1-3>    Priority: 1=High, 2=Medium, 3=Low (default: 2)
    --status <status>   Status: BACKLOG, PLANNED, READY, IN_PROGRESS, TESTING, DONE
    --desc <text>       Description

  update <task_id>      Update an existing task
    --title <title>     New title
    --status <status>   New status
    --priority <1-3>    New priority
    --progress <0-100>  Progress percentage

  complete <task_id>    Mark task as DONE

  list                  List all tasks
    --status <status>   Filter by status
    --limit <n>         Limit results (default: 20)

  delete <task_id>      Move task to trash

  workspaces            List all workspaces

  help                  Show this help
`);
  }
};

// Parse arguments
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = value;
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

// Main
const args = parseArgs(process.argv);
const command = args._[0] || 'help';

if (commands[command]) {
  commands[command](args);
} else {
  console.error(`Unknown command: ${command}`);
  commands.help();
}

db.close();
