#!/usr/bin/env node
/**
 * FlowTask MCP Server
 * Allows Claude to directly manage tasks in FlowTask app
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';

// Database path
const dbPath = path.join(os.homedir(), 'AppData', 'Local', 'flowtask', 'flowtask.db');
const db = new Database(dbPath);

// Helper functions
function generateTaskId(taskType) {
  const suffix = uuidv4().substring(0, 4);
  return `${taskType}-${suffix}`;
}

function now() {
  return new Date().toISOString();
}

// Create MCP server
const server = new Server(
  {
    name: 'flowtask',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'flowtask_add',
        description: 'Add a new task to FlowTask app',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title',
            },
            type: {
              type: 'string',
              enum: ['feat', 'bug', 'research', 'chore'],
              description: 'Task type (default: feat)',
            },
            priority: {
              type: 'number',
              enum: [1, 2, 3],
              description: 'Priority: 1=High, 2=Medium, 3=Low (default: 2)',
            },
            status: {
              type: 'string',
              enum: ['BACKLOG', 'PLANNED', 'READY', 'IN_PROGRESS', 'TESTING', 'DONE'],
              description: 'Task status (default: BACKLOG)',
            },
            description: {
              type: 'string',
              description: 'Task description (optional)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'flowtask_update',
        description: 'Update an existing task in FlowTask',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID (e.g., feat-abc1)',
            },
            status: {
              type: 'string',
              enum: ['BACKLOG', 'PLANNED', 'READY', 'IN_PROGRESS', 'TESTING', 'DONE'],
            },
            progress: {
              type: 'number',
              description: 'Progress percentage (0-100)',
            },
            priority: {
              type: 'number',
              enum: [1, 2, 3],
            },
            title: {
              type: 'string',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'flowtask_complete',
        description: 'Mark a task as completed',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID to complete',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'flowtask_list',
        description: 'List all tasks in FlowTask',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['BACKLOG', 'PLANNED', 'READY', 'IN_PROGRESS', 'TESTING', 'DONE'],
              description: 'Filter by status (optional)',
            },
            limit: {
              type: 'number',
              description: 'Limit results (default: 20)',
            },
          },
        },
      },
      {
        name: 'flowtask_delete',
        description: 'Delete a task (move to trash)',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID to delete',
            },
          },
          required: ['taskId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'flowtask_add': {
        const id = uuidv4();
        const taskType = args.type || 'feat';
        const taskId = generateTaskId(taskType);
        const priority = args.priority || 2;
        const status = args.status || 'BACKLOG';
        const description = args.description || null;
        const timestamp = now();

        const stmt = db.prepare(`
          INSERT INTO tasks (id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, is_deleted, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, 1, 0, ?, ?)
        `);
        stmt.run(id, taskId, args.title, description, status, priority, taskType, null, timestamp, timestamp);

        return {
          content: [
            {
              type: 'text',
              text: `✅ Task added to FlowTask!\n   ID: ${taskId}\n   Title: ${args.title}\n   Type: ${taskType}\n   Priority: P${priority}\n   Status: ${status}`,
            },
          ],
        };
      }

      case 'flowtask_update': {
        const updates = [];
        const params = [];

        if (args.title) {
          updates.push('title = ?');
          params.push(args.title);
        }
        if (args.status) {
          updates.push('status = ?');
          params.push(args.status);
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
          return {
            content: [{ type: 'text', text: 'No updates specified' }],
          };
        }

        updates.push('updated_at = ?');
        params.push(now());
        params.push(args.taskId);
        params.push(args.taskId);

        const stmt = db.prepare(`
          UPDATE tasks SET ${updates.join(', ')}
          WHERE task_id = ? OR id = ?
        `);
        const result = stmt.run(...params);

        if (result.changes > 0) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ Task ${args.taskId} updated!${args.status ? `\n   Status: ${args.status}` : ''}${args.progress !== undefined ? `\n   Progress: ${args.progress}%` : ''}`,
              },
            ],
          };
        } else {
          return {
            content: [{ type: 'text', text: `Task ${args.taskId} not found` }],
          };
        }
      }

      case 'flowtask_complete': {
        const stmt = db.prepare(`
          UPDATE tasks SET status = 'DONE', progress = 100, updated_at = ?
          WHERE task_id = ? OR id = ?
        `);
        const result = stmt.run(now(), args.taskId, args.taskId);

        if (result.changes > 0) {
          return {
            content: [{ type: 'text', text: `✅ Task ${args.taskId} completed!` }],
          };
        } else {
          return {
            content: [{ type: 'text', text: `Task ${args.taskId} not found` }],
          };
        }
      }

      case 'flowtask_list': {
        const limit = args.limit || 20;
        let sql = 'SELECT task_id, title, status, priority, task_type, progress FROM tasks WHERE is_deleted = 0';
        const params = [];

        if (args.status) {
          sql += ' AND status = ?';
          params.push(args.status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(sql);
        const tasks = stmt.all(...params);

        if (tasks.length === 0) {
          return {
            content: [{ type: 'text', text: 'No tasks found' }],
          };
        }

        let output = '📋 FlowTask Tasks:\n';
        output += '─'.repeat(50) + '\n';
        tasks.forEach((task) => {
          const statusIcon = {
            BACKLOG: '📋',
            PLANNED: '📝',
            READY: '🎯',
            IN_PROGRESS: '🔧',
            TESTING: '🧪',
            DONE: '✅',
          }[task.status] || '❓';

          output += `${statusIcon} [${task.task_id}] ${task.title}\n`;
          output += `   ${task.task_type} | P${task.priority} | ${task.progress}% | ${task.status}\n`;
        });
        output += '─'.repeat(50) + '\n';
        output += `Total: ${tasks.length} tasks`;

        return {
          content: [{ type: 'text', text: output }],
        };
      }

      case 'flowtask_delete': {
        const stmt = db.prepare(`
          UPDATE tasks SET is_deleted = 1, updated_at = ?
          WHERE task_id = ? OR id = ?
        `);
        const result = stmt.run(now(), args.taskId, args.taskId);

        if (result.changes > 0) {
          return {
            content: [{ type: 'text', text: `🗑️ Task ${args.taskId} moved to trash` }],
          };
        } else {
          return {
            content: [{ type: 'text', text: `Task ${args.taskId} not found` }],
          };
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FlowTask MCP Server running');
}

main().catch(console.error);
