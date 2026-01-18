#!/usr/bin/env node
/**
 * Luqman AI Task Manager - API Server
 * Simple HTTP API for Claude to manage tasks
 * Run: node api-server.cjs
 * Port: 3847
 */

const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const PORT = 3847;
const dbPath = path.join(os.homedir(), 'AppData', 'Local', 'flowtask', 'flowtask.db');
const db = new Database(dbPath);

// ============ WORKSPACE SUPPORT ============

// Ensure workspaces table has correct schema (compatible with Tauri app)
try {
  const tableInfo = db.prepare("PRAGMA table_info(workspaces)").all();
  const hasColor = tableInfo.some(col => col.name === 'color');

  if (tableInfo.length > 0 && !hasColor) {
    // Add missing color column
    console.log('[Migration] Adding color column to workspaces table...');
    db.exec("ALTER TABLE workspaces ADD COLUMN color TEXT DEFAULT '#3b82f6'");
  }

  // Remove updated_at if it exists (not in Tauri schema)
  const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
  if (hasUpdatedAt) {
    // SQLite doesn't support DROP COLUMN easily, just ignore this field
    console.log('[Note] Workspaces table has updated_at column (will be ignored)');
  }
} catch (e) {
  console.log('[Migration] Workspaces table check:', e.message);
}

// Generate a random color for new workspaces
function randomColor() {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Get or create workspace by name (handles both old and new schema)
function getOrCreateWorkspace(name) {
  if (!name) return null;

  const normalizedName = name.toLowerCase().trim();
  let workspace = db.prepare('SELECT * FROM workspaces WHERE LOWER(name) = ?').get(normalizedName);

  if (!workspace) {
    const id = uuidv4();
    const timestamp = now();
    const color = randomColor();

    // Check if table has updated_at column
    const tableInfo = db.prepare("PRAGMA table_info(workspaces)").all();
    const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');

    if (hasUpdatedAt) {
      db.prepare('INSERT INTO workspaces (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, name, color, timestamp, timestamp);
    } else {
      db.prepare('INSERT INTO workspaces (id, name, color, created_at) VALUES (?, ?, ?, ?)')
        .run(id, name, color, timestamp);
    }

    workspace = { id, name, color, created_at: timestamp };
    console.log(`[Workspace] Created new workspace: "${name}" with color ${color}`);
  }

  return workspace;
}

function generateTaskId(taskType) {
  return `${taskType}-${uuidv4().substring(0, 4)}`;
}

function now() {
  return new Date().toISOString();
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// ============ AUTOMATION RULES ============

// Apply automation rules after task update
// updatedFields: object with fields that were explicitly updated
function applyAutomation(taskId, updatedFields = {}) {
  const task = db.prepare('SELECT * FROM tasks WHERE (task_id = ? OR id = ?) AND is_deleted = 0').get(taskId, taskId);
  if (!task) return null;

  let changes = [];

  // Rule 1: Auto-complete when progress = 100%
  if (task.progress === 100 && task.status !== 'DONE') {
    db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
      .run('DONE', now(), task.id);
    changes.push('Auto-completed (progress 100%)');
  }

  // Rule 2: Auto-move to IN_PROGRESS when progress > 0 (only if progress was updated, not status)
  if (updatedFields.progress && !updatedFields.status &&
      task.progress > 0 && task.progress < 100 &&
      ['BACKLOG', 'PLANNED', 'READY'].includes(task.status)) {
    db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
      .run('IN_PROGRESS', now(), task.id);
    changes.push('Auto-moved to IN_PROGRESS');
  }

  // Rule 3: Reset progress to 0 when explicitly moved back to BACKLOG
  if (updatedFields.status && task.status === 'BACKLOG' && task.progress > 0) {
    db.prepare('UPDATE tasks SET progress = 0, updated_at = ? WHERE id = ?')
      .run(now(), task.id);
    changes.push('Reset progress to 0');
  }

  return changes.length > 0 ? changes : null;
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    // GET /workspaces - List all workspaces
    if (req.method === 'GET' && pathname === '/workspaces') {
      const workspaces = db.prepare('SELECT * FROM workspaces ORDER BY name ASC').all();
      return sendJSON(res, { success: true, workspaces, count: workspaces.length });
    }

    // GET /tasks - List all tasks (with optional workspace filter)
    if (req.method === 'GET' && pathname === '/tasks') {
      const status = url.searchParams.get('status');
      const workspace = url.searchParams.get('workspace');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let sql = 'SELECT t.*, w.name as workspace_name FROM tasks t LEFT JOIN workspaces w ON t.workspace_id = w.id WHERE t.is_deleted = 0';
      const params = [];

      if (status) {
        sql += ' AND t.status = ?';
        params.push(status.toUpperCase());
      }

      if (workspace) {
        // Get workspace by name
        const ws = db.prepare('SELECT id FROM workspaces WHERE LOWER(name) = ?').get(workspace.toLowerCase());
        if (ws) {
          sql += ' AND t.workspace_id = ?';
          params.push(ws.id);
        } else {
          // No workspace found, return empty
          return sendJSON(res, { success: true, tasks: [], count: 0, workspace: workspace, message: 'Workspace not found' });
        }
      }

      sql += ' ORDER BY t.created_at DESC LIMIT ?';
      params.push(limit);

      const tasks = db.prepare(sql).all(...params);
      return sendJSON(res, { success: true, tasks, count: tasks.length, workspace: workspace || 'all' });
    }

    // POST /tasks - Create new task (with optional workspace)
    if (req.method === 'POST' && pathname === '/tasks') {
      const body = await parseBody(req);

      if (!body.title) {
        return sendJSON(res, { success: false, error: 'Title is required' }, 400);
      }

      const id = uuidv4();
      const taskType = body.type || 'feat';
      const taskId = generateTaskId(taskType);
      const priority = body.priority || 2;
      const status = body.status || 'BACKLOG';
      const description = body.description || null;
      const timestamp = now();

      // Handle workspace - auto-create if provided
      let workspaceId = null;
      let workspaceName = null;
      if (body.workspace) {
        const workspace = getOrCreateWorkspace(body.workspace);
        if (workspace) {
          workspaceId = workspace.id;
          workspaceName = workspace.name;
        }
      }

      db.prepare(`
        INSERT INTO tasks (id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, is_deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, 1, 0, ?, ?)
      `).run(id, taskId, body.title, description, status, priority, taskType, workspaceId, timestamp, timestamp);

      return sendJSON(res, {
        success: true,
        message: 'Task created',
        task: { id, taskId, title: body.title, type: taskType, priority, status, workspace: workspaceName }
      });
    }

    // PUT /tasks/:id - Update task
    if (req.method === 'PUT' && pathname.startsWith('/tasks/')) {
      const taskId = pathname.split('/')[2];
      const body = await parseBody(req);

      const updates = [];
      const params = [];
      const updatedFields = {}; // Track which fields were updated

      if (body.title) { updates.push('title = ?'); params.push(body.title); updatedFields.title = true; }
      if (body.status) { updates.push('status = ?'); params.push(body.status.toUpperCase()); updatedFields.status = true; }
      if (body.priority) { updates.push('priority = ?'); params.push(body.priority); updatedFields.priority = true; }
      if (body.progress !== undefined) { updates.push('progress = ?'); params.push(body.progress); updatedFields.progress = true; }
      if (body.description) { updates.push('description = ?'); params.push(body.description); updatedFields.description = true; }

      if (updates.length === 0) {
        return sendJSON(res, { success: false, error: 'No updates provided' }, 400);
      }

      updates.push('updated_at = ?');
      params.push(now());
      params.push(taskId);
      params.push(taskId);

      const result = db.prepare(`
        UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ? OR id = ?
      `).run(...params);

      if (result.changes > 0) {
        // Apply automation rules with info about what was updated
        const automationChanges = applyAutomation(taskId, updatedFields);
        return sendJSON(res, {
          success: true,
          message: `Task ${taskId} updated`,
          automation: automationChanges
        });
      } else {
        return sendJSON(res, { success: false, error: 'Task not found' }, 404);
      }
    }

    // POST /tasks/:id/complete - Complete task
    if (req.method === 'POST' && pathname.match(/^\/tasks\/[^/]+\/complete$/)) {
      const taskId = pathname.split('/')[2];

      const result = db.prepare(`
        UPDATE tasks SET status = 'DONE', progress = 100, updated_at = ? WHERE task_id = ? OR id = ?
      `).run(now(), taskId, taskId);

      if (result.changes > 0) {
        return sendJSON(res, { success: true, message: `Task ${taskId} completed!` });
      } else {
        return sendJSON(res, { success: false, error: 'Task not found' }, 404);
      }
    }

    // DELETE /tasks/:id - Delete task
    if (req.method === 'DELETE' && pathname.startsWith('/tasks/')) {
      const taskId = pathname.split('/')[2];

      const result = db.prepare(`
        UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE task_id = ? OR id = ?
      `).run(now(), taskId, taskId);

      if (result.changes > 0) {
        return sendJSON(res, { success: true, message: `Task ${taskId} deleted` });
      } else {
        return sendJSON(res, { success: false, error: 'Task not found' }, 404);
      }
    }

    // GET /sync - Get tasks updated since timestamp (for polling)
    if (req.method === 'GET' && pathname === '/sync') {
      const since = url.searchParams.get('since');
      let tasks;

      if (since) {
        tasks = db.prepare('SELECT * FROM tasks WHERE updated_at > ? AND is_deleted = 0 ORDER BY updated_at DESC')
          .all(since);
      } else {
        tasks = db.prepare('SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY updated_at DESC LIMIT 50')
          .all();
      }

      return sendJSON(res, {
        success: true,
        tasks,
        count: tasks.length,
        timestamp: now()
      });
    }

    // GET / - API info
    if (req.method === 'GET' && pathname === '/') {
      const os = require('os');
      const fs = require('fs');
      const globalClaudePath = path.join(os.homedir(), 'CLAUDE.md');
      const hasGlobalConfig = fs.existsSync(globalClaudePath);

      return sendJSON(res, {
        name: 'Luqman AI Task Manager API',
        version: '1.3.0',
        status: 'running',
        setup: {
          globalConfig: hasGlobalConfig ? 'configured ✅' : 'not configured ❌',
          setupCommand: 'npm run setup',
          configPath: globalClaudePath,
          helpText: hasGlobalConfig
            ? 'Global configuration detected. Claude can create tasks from any project!'
            : 'Run "npm run setup" to enable Claude integration in all projects.'
        },
        features: [
          'Workspace support - auto-create workspace from folder name',
          'Global configuration - setup once, works everywhere',
          'Auto-complete tasks when progress = 100%',
          'Auto-move to IN_PROGRESS when progress > 0',
          'Sync endpoint for real-time updates'
        ],
        endpoints: {
          'GET /': 'API documentation (you are here)',
          'GET /workspaces': 'List all workspaces',
          'POST /workspaces': 'Create workspace { name, color? }',
          'GET /tasks': 'List all tasks',
          'GET /tasks?workspace=name': 'List tasks filtered by workspace',
          'GET /tasks?status=STATUS': 'List tasks filtered by status',
          'GET /sync?since=ISO_DATE': 'Get tasks updated since timestamp',
          'POST /tasks': 'Create task { title, type?, priority?, status?, description?, workspace? }',
          'PUT /tasks/:id': 'Update task (with automation)',
          'POST /tasks/:id/complete': 'Mark task as done',
          'DELETE /tasks/:id': 'Delete task'
        },
        examples: {
          'Create task': 'curl -X POST http://localhost:3847/tasks -H "Content-Type: application/json" -d \'{"title":"My task","workspace":"my-project"}\'',
          'List tasks': 'curl http://localhost:3847/tasks',
          'Complete task': 'curl -X POST http://localhost:3847/tasks/TASK_ID/complete',
          'List workspaces': 'curl http://localhost:3847/workspaces'
        }
      });
    }

    // 404
    sendJSON(res, { success: false, error: 'Not found' }, 404);

  } catch (error) {
    sendJSON(res, { success: false, error: error.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Luqman AI Task Manager API running on http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET    /tasks              - List all tasks');
  console.log('  POST   /tasks              - Create task');
  console.log('  PUT    /tasks/:id          - Update task');
  console.log('  POST   /tasks/:id/complete - Complete task');
  console.log('  DELETE /tasks/:id          - Delete task');
  console.log('');
  console.log('Example:');
  console.log('  curl http://localhost:3847/tasks');
  console.log('  curl -X POST http://localhost:3847/tasks -H "Content-Type: application/json" -d "{\\"title\\":\\"My task\\"}"');
});
