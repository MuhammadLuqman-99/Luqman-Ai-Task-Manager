# Luqman AI Task Manager

A modern Kanban-style task management application with AI integration, built with Tauri (Rust + React).

## Features

- **Kanban Board** - Drag & drop task management with 6 columns (Backlog, Planned, Ready, In Progress, Testing, Done)
- **AI Integration** - Claude can manage tasks directly via REST API or MCP Server
- **Plans Page** - Calendar view for planning and scheduling tasks
- **Rules Page** - Automation rules for task workflows
- **Stats Page** - Analytics dashboard with productivity charts
- **Workspaces** - Organize tasks by project/workspace
- **Local Storage** - SQLite database for offline-first experience
- **Real-time Sync** - Tasks update instantly when managed by AI

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Tauri 2.0 (Rust) + SQLite
- **State:** Zustand with persist middleware
- **AI Integration:** REST API (port 3847) + MCP Server

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/MuhammadLuqman-99/Luqman-Ai-Task-Manager.git
cd Luqman-Ai-Task-Manager

# Install dependencies
npm install

# Run development server
npm run tauri dev

# Build for production
npm run tauri build
```

### AI Integration (Claude)

Start the API server to let Claude manage your tasks:

```bash
# Start the API server
node api-server.cjs

# API runs on http://localhost:3847
```

Then Claude can create, update, and complete tasks directly in your app!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List all tasks |
| POST | /tasks | Create new task |
| PUT | /tasks/:id | Update task |
| POST | /tasks/:id/complete | Mark task as done |
| DELETE | /tasks/:id | Delete task |

### Example: Create a task via API

```bash
curl -X POST http://localhost:3847/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Build login page","type":"feat","priority":1}'
```

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components (Kanban, Plans, Rules, Stats)
│   ├── stores/            # Zustand state management
│   └── types/             # TypeScript type definitions
├── src-tauri/             # Rust backend (Tauri)
├── mcp-server/            # MCP server for Claude Desktop
├── scripts/               # CLI tools
├── api-server.cjs         # REST API server for AI integration
└── CLAUDE.md              # Instructions for Claude AI
```

## Screenshots

Coming soon...

## Author

**Muhammad Luqman**

## License

MIT
