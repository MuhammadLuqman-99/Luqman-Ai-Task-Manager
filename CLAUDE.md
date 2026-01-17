# Luqman AI Task Manager - Project Instructions

## TASK MANAGEMENT - DUAL TRACKING

When the user asks to "create task", "add task", "update task", "complete task", "delete task", "show tasks", or "list tasks":

**DO BOTH:**
1. **First** → Call the Luqman AI Task Manager API (so tasks appear in the app)
2. **Then** → Use TodoWrite to track the same task in Claude's interface (for visual progress)

This way:
- Tasks are saved in the user's Luqman AI Task Manager app (persistent)
- Claude also shows progress visually during the session

## Workspace Auto-Detection

**IMPORTANT:** Always detect the current folder name and use it as the workspace!

1. Get the current working directory folder name (e.g., if in `/portfolio`, workspace = "portfolio")
2. Include `"workspace": "FOLDER_NAME"` in ALL task API calls
3. This ensures tasks are organized by project

## Quick Commands (Copy-Paste Ready)

**Create a task (with workspace):**
```bash
curl -s -X POST http://localhost:3847/tasks -H "Content-Type: application/json" -d "{\"title\":\"YOUR_TASK_TITLE\",\"type\":\"feat\",\"priority\":2,\"workspace\":\"FOLDER_NAME\"}"
```

**List tasks for current workspace:**
```bash
curl -s "http://localhost:3847/tasks?workspace=FOLDER_NAME"
```

**List all workspaces:**
```bash
curl -s http://localhost:3847/workspaces
```

**Update task progress:**
```bash
curl -s -X PUT http://localhost:3847/tasks/TASK_ID -H "Content-Type: application/json" -d "{\"progress\":50}"
```

**Complete a task:**
```bash
curl -s -X POST http://localhost:3847/tasks/TASK_ID/complete
```

---

## Full API Documentation

## API Server (Recommended)

First, start the API server if not running:
```bash
node "c:\Users\desa murni\Desktop\flowtask\api-server.cjs"
```

### API Endpoints (Port 3847)

```bash
# List all tasks
curl http://localhost:3847/tasks

# Create a new task
curl -X POST http://localhost:3847/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Task title","type":"feat","priority":1,"description":"Details"}'

# Update a task
curl -X PUT http://localhost:3847/tasks/<task_id> \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","progress":50}'

# Complete a task
curl -X POST http://localhost:3847/tasks/<task_id>/complete

# Delete a task
curl -X DELETE http://localhost:3847/tasks/<task_id>
```

## CLI Commands (Alternative)

```bash
# Add a new task
node "c:\Users\desa murni\Desktop\flowtask\scripts\task-cli.cjs" add "Task title" --type feat --priority 2 --status BACKLOG

# Update a task
node "c:\Users\desa murni\Desktop\flowtask\scripts\task-cli.cjs" update <task_id> --status IN_PROGRESS --progress 50

# Complete a task
node "c:\Users\desa murni\Desktop\flowtask\scripts\task-cli.cjs" complete <task_id>

# List all tasks
node "c:\Users\desa murni\Desktop\flowtask\scripts\task-cli.cjs" list

# Delete a task
node "c:\Users\desa murni\Desktop\flowtask\scripts\task-cli.cjs" delete <task_id>
```

### Task Types
- `feat` - Feature (default)
- `bug` - Bug fix
- `research` - Research task
- `chore` - Maintenance task

### Priority Levels
- `1` - High priority (P1)
- `2` - Medium priority (P2, default)
- `3` - Low priority (P3)

### Status Options
- `BACKLOG` - Not started (default)
- `PLANNED` - Planned for work
- `READY` - Ready to start
- `IN_PROGRESS` - Currently working
- `TESTING` - In testing
- `DONE` - Completed

## Running the App

```bash
cd "c:\Users\desa murni\Desktop\flowtask"
npm run tauri dev
```

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Tauri (Rust) + SQLite
- State: Zustand with persist
