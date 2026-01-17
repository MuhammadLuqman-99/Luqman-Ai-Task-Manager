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
    // GET /tasks - List all tasks
    if (req.method === 'GET' && pathname === '/tasks') {
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let sql = 'SELECT * FROM tasks WHERE is_deleted = 0';
      const params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status.toUpperCase());
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const tasks = db.prepare(sql).all(...params);
      return sendJSON(res, { success: true, tasks, count: tasks.length });
    }

    // POST /tasks - Create new task
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

      db.prepare(`
        INSERT INTO tasks (id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, is_deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, 1, 0, ?, ?)
      `).run(id, taskId, body.title, description, status, priority, taskType, null, timestamp, timestamp);

      return sendJSON(res, {
        success: true,
        message: 'Task created',
        task: { id, taskId, title: body.title, type: taskType, priority, status }
      });
    }

    // PUT /tasks/:id - Update task
    if (req.method === 'PUT' && pathname.startsWith('/tasks/')) {
      const taskId = pathname.split('/')[2];
      const body = await parseBody(req);

      const updates = [];
      const params = [];

      if (body.title) { updates.push('title = ?'); params.push(body.title); }
      if (body.status) { updates.push('status = ?'); params.push(body.status.toUpperCase()); }
      if (body.priority) { updates.push('priority = ?'); params.push(body.priority); }
      if (body.progress !== undefined) { updates.push('progress = ?'); params.push(body.progress); }
      if (body.description) { updates.push('description = ?'); params.push(body.description); }

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
        return sendJSON(res, { success: true, message: `Task ${taskId} updated` });
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

    // GET / - API info
    if (req.method === 'GET' && pathname === '/') {
      return sendJSON(res, {
        name: 'Luqman AI Task Manager API',
        version: '1.0.0',
        endpoints: {
          'GET /tasks': 'List all tasks',
          'POST /tasks': 'Create task { title, type?, priority?, status?, description? }',
          'PUT /tasks/:id': 'Update task { title?, status?, priority?, progress? }',
          'POST /tasks/:id/complete': 'Mark task as done',
          'DELETE /tasks/:id': 'Delete task'
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
