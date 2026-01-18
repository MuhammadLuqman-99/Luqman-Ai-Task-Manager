# Luqman AI Task Manager - User Setup Guide

## One-Time Setup (5 minutes)

### Step 1: Install the App

1. Download the installer for your platform (coming soon)
2. Run the installer
3. Launch "Luqman AI Task Manager"

### Step 2: Enable Claude Integration (Optional)

If you want to use Claude Code or other AI assistants with this app:

Run this command **once** from the app directory:

```bash
npm run setup
```

That's it! This creates a global configuration file that Claude will detect in all your projects.

## Daily Usage

### Using the App

1. Open Luqman AI Task Manager (desktop app)
2. Create tasks, organize them, track time
3. Everything is saved locally on your computer

### Using with Claude Code (Optional)

If you completed Step 2, Claude can now manage your tasks from any project:

1. Open any project in VS Code with Claude Code
2. Say: "Create a task to implement user authentication"
3. Claude will add it to your Luqman AI Task Manager automatically
4. The workspace is auto-detected from your folder name!

**No configuration needed per project!** The global setup works everywhere.

## How It Works

```
┌─────────────────────────────────────────┐
│  Your Project (any folder)              │
│  - Claude auto-detects workspace        │
│  - Reads global config from home dir    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API Server (localhost:3847)            │
│  - Receives task commands               │
│  - Manages tasks in SQLite              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Desktop App (Tauri)                    │
│  - Shows your tasks visually            │
│  - Kanban board, time tracking, etc.    │
└─────────────────────────────────────────┘
```

## What Was Created

When you ran `npm run setup`, it created:

- `~/CLAUDE.md` - Global configuration file
  - Claude Code automatically detects this
  - Works in all your projects
  - No need to copy anything per-project!

## Starting the App

### Method 1: Full Start (Recommended)

```bash
npm run start
```

This starts both:
- API server (for Claude integration)
- Desktop app (visual interface)

### Method 2: Desktop App Only

```bash
npm run tauri dev
```

Use this if you don't need Claude integration.

## Troubleshooting

### Claude Can't Create Tasks

**Check 1:** Is the API server running?
```bash
# Start it with:
npm run api

# Or include it in full start:
npm run start
```

**Check 2:** Is the global config present?
```bash
# Check if file exists (Windows):
dir %USERPROFILE%\CLAUDE.md

# Check if file exists (Mac/Linux):
ls ~/CLAUDE.md
```

**Fix:** Run setup again:
```bash
npm run setup
```

### Tasks Not Showing in App

1. Make sure the desktop app is running
2. Check that you're looking at the correct workspace
3. Try refreshing the app

### Port 3847 Already in Use

Another instance of the API server might be running:

**Windows:**
```bash
netstat -ano | findstr :3847
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3847 | xargs kill
```

## Advanced Usage

### Manual API Commands

You can also control tasks directly with curl:

```bash
# Create a task
curl -X POST http://localhost:3847/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My task","type":"feat","priority":2}'

# List tasks
curl http://localhost:3847/tasks

# Complete a task
curl -X POST http://localhost:3847/tasks/<task_id>/complete
```

### Multiple Workspaces

Tasks are automatically organized by workspace (folder name). When you work in different project folders, Claude will automatically create tasks in the appropriate workspace.

Examples:
- `/projects/website` → tasks go to "website" workspace
- `/projects/mobile-app` → tasks go to "mobile-app" workspace

### Workspace Management

List all workspaces:
```bash
curl http://localhost:3847/workspaces
```

Create a custom workspace:
```bash
curl -X POST http://localhost:3847/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"my-project","color":"#10b981"}'
```

## For Developers

Want to contribute or customize? See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup.

## Support

- GitHub Issues: [Report a bug](https://github.com/yourusername/luqman-ai-task-manager/issues)
- Documentation: [Full docs](https://docs.example.com)

## Privacy

All your data is stored locally on your computer. No cloud sync, no data collection.
- Database location: `~/.luqman-task-manager/tasks.db`
- Configuration: `~/CLAUDE.md`
