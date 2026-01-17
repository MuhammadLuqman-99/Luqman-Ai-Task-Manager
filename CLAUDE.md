# Luqman AI Task Manager - Project Instructions

## Task Management

**IMPORTANT:** This project has its own task management system (Luqman AI Task Manager).

When the user asks to:
- Add a task
- Create a task
- Update a task
- Complete a task
- Delete a task
- Show tasks
- List tasks

**DO NOT use the internal TodoWrite tool.** Instead, use the Luqman AI Task Manager API:

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
