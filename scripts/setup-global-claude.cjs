#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const globalClaudePath = path.join(homeDir, 'CLAUDE.md');

const claudeContent = `# Luqman AI Task Manager - Global Configuration

## Auto-Detection

This configuration is detected globally. The task manager automatically detects your current workspace from the folder name.

## Quick Task Commands

**Create a task:**
\`\`\`bash
curl -s -X POST http://localhost:3847/tasks -H "Content-Type: application/json" -d "{\\"title\\":\\"YOUR_TASK\\",\\"type\\":\\"feat\\",\\"priority\\":2}"
\`\`\`

**List tasks:**
\`\`\`bash
curl -s http://localhost:3847/tasks
\`\`\`

**Complete a task:**
\`\`\`bash
curl -s -X POST http://localhost:3847/tasks/TASK_ID/complete
\`\`\`

## API Server

The API server runs on port 3847. Start it with:
\`\`\`bash
node "${path.join(__dirname, '..', 'api-server.cjs').replace(/\\/g, '\\\\')}"
\`\`\`

## Workspace Auto-Detection

The task manager automatically uses your current folder name as the workspace. No configuration needed!

## Full API Documentation

### Create Task
\`\`\`bash
curl -X POST http://localhost:3847/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Task title","type":"feat","priority":1,"workspace":"auto"}'
\`\`\`

### List Tasks
\`\`\`bash
curl http://localhost:3847/tasks
curl http://localhost:3847/tasks?workspace=my-project
\`\`\`

### Update Task
\`\`\`bash
curl -X PUT http://localhost:3847/tasks/<task_id> \\
  -H "Content-Type: application/json" \\
  -d '{"status":"IN_PROGRESS","progress":50}'
\`\`\`

### Complete Task
\`\`\`bash
curl -X POST http://localhost:3847/tasks/<task_id>/complete
\`\`\`

### Delete Task
\`\`\`bash
curl -X DELETE http://localhost:3847/tasks/<task_id>
\`\`\`

## Task Types
- \`feat\` - Feature (default)
- \`bug\` - Bug fix
- \`research\` - Research task
- \`chore\` - Maintenance task

## Priority Levels
- \`1\` - High priority (P1)
- \`2\` - Medium priority (P2, default)
- \`3\` - Low priority (P3)

## Status Options
- \`BACKLOG\` - Not started (default)
- \`PLANNED\` - Planned for work
- \`READY\` - Ready to start
- \`IN_PROGRESS\` - Currently working
- \`TESTING\` - In testing
- \`DONE\` - Completed
`;

console.log('🚀 Luqman AI Task Manager - Global Setup\n');

// Check if file exists
if (fs.existsSync(globalClaudePath)) {
  console.log(`⚠️  Global CLAUDE.md already exists at: ${globalClaudePath}`);
  console.log('Would you like to overwrite it? (y/n)');

  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y' || answer === 'yes') {
      writeFile();
    } else {
      console.log('❌ Setup cancelled.');
      process.exit(0);
    }
  });
} else {
  writeFile();
}

function writeFile() {
  try {
    fs.writeFileSync(globalClaudePath, claudeContent, 'utf8');
    console.log(`✅ Global CLAUDE.md created at: ${globalClaudePath}`);
    console.log('\n📝 Next steps:');
    console.log('1. Start the API server: npm run api-server');
    console.log('2. Open your Luqman AI Task Manager app');
    console.log('3. Use Claude Code in any project - it will auto-detect this configuration!');
    console.log('\n💡 The workspace is automatically detected from your folder name.');
  } catch (error) {
    console.error('❌ Error writing file:', error.message);
    process.exit(1);
  }
}
