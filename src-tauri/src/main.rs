#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use chrono::Utc;
use uuid::Uuid;

// ============ Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaskStatus {
    Backlog,
    Planned,
    Ready,
    InProgress,
    Testing,
    Done,
}

impl TaskStatus {
    fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "BACKLOG" => Some(TaskStatus::Backlog),
            "PLANNED" => Some(TaskStatus::Planned),
            "READY" => Some(TaskStatus::Ready),
            "IN_PROGRESS" => Some(TaskStatus::InProgress),
            "TESTING" => Some(TaskStatus::Testing),
            "DONE" => Some(TaskStatus::Done),
            _ => None,
        }
    }

    fn to_string(&self) -> String {
        match self {
            TaskStatus::Backlog => "BACKLOG".to_string(),
            TaskStatus::Planned => "PLANNED".to_string(),
            TaskStatus::Ready => "READY".to_string(),
            TaskStatus::InProgress => "IN_PROGRESS".to_string(),
            TaskStatus::Testing => "TESTING".to_string(),
            TaskStatus::Done => "DONE".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskType {
    Feat,
    Bug,
    Research,
    Chore,
}

impl TaskType {
    fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "feat" => Some(TaskType::Feat),
            "bug" => Some(TaskType::Bug),
            "research" => Some(TaskType::Research),
            "chore" => Some(TaskType::Chore),
            _ => None,
        }
    }

    fn to_string(&self) -> String {
        match self {
            TaskType::Feat => "feat".to_string(),
            TaskType::Bug => "bug".to_string(),
            TaskType::Research => "research".to_string(),
            TaskType::Chore => "chore".to_string(),
        }
    }

    fn prefix(&self) -> &str {
        match self {
            TaskType::Feat => "feat",
            TaskType::Bug => "bug",
            TaskType::Research => "research",
            TaskType::Chore => "chore",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: i32,
    pub task_type: String,
    pub workspace_id: Option<String>,
    pub tags: Vec<String>,
    pub progress: i32,
    pub is_ai_linked: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub task_count: i32,
    pub created_at: String,
}

// ============ Database ============

struct AppState {
    db: Mutex<Connection>,
}

fn init_database(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#3b82f6',
            icon TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'BACKLOG',
            priority INTEGER NOT NULL DEFAULT 2,
            task_type TEXT NOT NULL DEFAULT 'feat',
            workspace_id TEXT REFERENCES workspaces(id),
            tags TEXT DEFAULT '[]',
            progress INTEGER DEFAULT 0,
            is_ai_linked INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        "
    )?;

    // Insert default workspace if empty
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM workspaces", [], |row| row.get(0))?;
    if count == 0 {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO workspaces (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![Uuid::new_v4().to_string(), "Development", "#3b82f6", now],
        )?;
    }

    Ok(())
}

fn generate_task_id(task_type: &TaskType) -> String {
    let suffix: String = Uuid::new_v4().to_string().chars().take(4).collect();
    format!("{}-{}", task_type.prefix(), suffix)
}

// ============ Commands ============

#[tauri::command]
fn get_workspaces(state: tauri::State<AppState>) -> Result<Vec<Workspace>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT w.id, w.name, w.color, w.icon, w.created_at,
                (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id AND is_deleted = 0) as task_count
         FROM workspaces w ORDER BY w.name"
    ).map_err(|e| e.to_string())?;

    let workspaces = stmt.query_map([], |row| {
        Ok(Workspace {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            icon: row.get(3)?,
            created_at: row.get(4)?,
            task_count: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    workspaces.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_workspace(state: tauri::State<AppState>, name: String, color: String) -> Result<Workspace, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO workspaces (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, color, now],
    ).map_err(|e| e.to_string())?;

    Ok(Workspace {
        id,
        name,
        color,
        icon: None,
        task_count: 0,
        created_at: now,
    })
}

#[tauri::command]
fn delete_workspace(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Delete tasks in workspace
    conn.execute("DELETE FROM tasks WHERE workspace_id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    // Delete workspace
    conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    let tags_str: String = row.get(8)?;
    let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
    Ok(Task {
        id: row.get(0)?,
        task_id: row.get(1)?,
        title: row.get(2)?,
        description: row.get(3)?,
        status: row.get(4)?,
        priority: row.get(5)?,
        task_type: row.get(6)?,
        workspace_id: row.get(7)?,
        tags,
        progress: row.get(9)?,
        is_ai_linked: row.get::<_, i32>(10)? == 1,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

#[tauri::command]
fn get_tasks(state: tauri::State<AppState>, workspace_id: Option<String>, include_deleted: bool) -> Result<Vec<Task>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();

    if let Some(ws_id) = workspace_id {
        let sql = if include_deleted {
            "SELECT id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, created_at, updated_at FROM tasks WHERE workspace_id = ?1 ORDER BY created_at DESC"
        } else {
            "SELECT id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, created_at, updated_at FROM tasks WHERE workspace_id = ?1 AND is_deleted = 0 ORDER BY created_at DESC"
        };
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![ws_id], row_to_task).map_err(|e| e.to_string())?;
        for row in rows {
            tasks.push(row.map_err(|e| e.to_string())?);
        }
    } else {
        let sql = if include_deleted {
            "SELECT id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, created_at, updated_at FROM tasks ORDER BY created_at DESC"
        } else {
            "SELECT id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, created_at, updated_at FROM tasks WHERE is_deleted = 0 ORDER BY created_at DESC"
        };
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], row_to_task).map_err(|e| e.to_string())?;
        for row in rows {
            tasks.push(row.map_err(|e| e.to_string())?);
        }
    }

    Ok(tasks)
}

#[tauri::command]
fn create_task(
    state: tauri::State<AppState>,
    title: String,
    description: Option<String>,
    task_type: String,
    priority: i32,
    workspace_id: Option<String>,
    status: Option<String>,
) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let t_type = TaskType::from_str(&task_type).unwrap_or(TaskType::Feat);
    let task_id = generate_task_id(&t_type);
    let now = Utc::now().to_rfc3339();
    let status_str = status.unwrap_or_else(|| "BACKLOG".to_string());

    conn.execute(
        "INSERT INTO tasks (id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, is_deleted, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, '[]', 0, 0, 0, ?9, ?10)",
        params![id, task_id, title, description, status_str, priority, task_type, workspace_id, now, now],
    ).map_err(|e| e.to_string())?;

    Ok(Task {
        id,
        task_id,
        title,
        description,
        status: status_str,
        priority,
        task_type,
        workspace_id,
        tags: vec![],
        progress: 0,
        is_ai_linked: false,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
fn update_task(
    state: tauri::State<AppState>,
    id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    progress: Option<i32>,
    is_ai_linked: Option<bool>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    // Update each field individually if provided
    if let Some(ref t) = title {
        conn.execute(
            "UPDATE tasks SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![t, &now, &id],
        ).map_err(|e| e.to_string())?;
    }

    if let Some(ref d) = description {
        conn.execute(
            "UPDATE tasks SET description = ?1, updated_at = ?2 WHERE id = ?3",
            params![d, &now, &id],
        ).map_err(|e| e.to_string())?;
    }

    if let Some(ref s) = status {
        conn.execute(
            "UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![s, &now, &id],
        ).map_err(|e| e.to_string())?;
    }

    if let Some(p) = priority {
        conn.execute(
            "UPDATE tasks SET priority = ?1, updated_at = ?2 WHERE id = ?3",
            params![p, &now, &id],
        ).map_err(|e| e.to_string())?;
    }

    if let Some(pr) = progress {
        conn.execute(
            "UPDATE tasks SET progress = ?1, updated_at = ?2 WHERE id = ?3",
            params![pr, &now, &id],
        ).map_err(|e| e.to_string())?;
    }

    if let Some(ai) = is_ai_linked {
        conn.execute(
            "UPDATE tasks SET is_ai_linked = ?1, updated_at = ?2 WHERE id = ?3",
            params![if ai { 1 } else { 0 }, &now, &id],
        ).map_err(|e| e.to_string())?;
    }

    // If no fields were provided, just update the timestamp
    if title.is_none() && description.is_none() && status.is_none()
        && priority.is_none() && progress.is_none() && is_ai_linked.is_none() {
        conn.execute(
            "UPDATE tasks SET updated_at = ?1 WHERE id = ?2",
            params![&now, &id],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn update_task_status(state: tauri::State<AppState>, id: String, status: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, now, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_task(state: tauri::State<AppState>, id: String, permanent: bool) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    if permanent {
        conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
    } else {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE tasks SET is_deleted = 1, updated_at = ?1 WHERE id = ?2",
            params![now, id],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn restore_task(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET is_deleted = 0, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_trash(state: tauri::State<AppState>) -> Result<Vec<Task>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, created_at, updated_at
         FROM tasks WHERE is_deleted = 1 ORDER BY updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let tasks = stmt.query_map([], |row| {
        let tags_str: String = row.get(8)?;
        let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
        Ok(Task {
            id: row.get(0)?,
            task_id: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            priority: row.get(5)?,
            task_type: row.get(6)?,
            workspace_id: row.get(7)?,
            tags,
            progress: row.get(9)?,
            is_ai_linked: row.get::<_, i32>(10)? == 1,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?;

    tasks.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn empty_trash(state: tauri::State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tasks WHERE is_deleted = 1", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn search_tasks(state: tauri::State<AppState>, query: String) -> Result<Vec<Task>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let search = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, task_id, title, description, status, priority, task_type, workspace_id, tags, progress, is_ai_linked, created_at, updated_at
         FROM tasks WHERE is_deleted = 0 AND (title LIKE ?1 OR task_id LIKE ?1 OR description LIKE ?1) ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let tasks = stmt.query_map(params![search], |row| {
        let tags_str: String = row.get(8)?;
        let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
        Ok(Task {
            id: row.get(0)?,
            task_id: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            priority: row.get(5)?,
            task_type: row.get(6)?,
            workspace_id: row.get(7)?,
            tags,
            progress: row.get(9)?,
            is_ai_linked: row.get::<_, i32>(10)? == 1,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?;

    tasks.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn main() {
    // Initialize database
    let db_path = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("flowtask")
        .join("flowtask.db");

    // Create directory if needed
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_database(&conn).expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(conn) })
        .invoke_handler(tauri::generate_handler![
            get_workspaces,
            create_workspace,
            delete_workspace,
            get_tasks,
            create_task,
            update_task,
            update_task_status,
            delete_task,
            restore_task,
            get_trash,
            empty_trash,
            search_tasks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
