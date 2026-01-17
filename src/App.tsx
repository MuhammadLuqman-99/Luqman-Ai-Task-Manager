import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { PlansPage } from '@/components/PlansPage';
import { RulesPage } from '@/components/RulesPage';
import { StatsPage } from '@/components/StatsPage';
import { NewTaskModal } from '@/components/NewTaskModal';
import { NewWorkspaceModal } from '@/components/NewWorkspaceModal';
import { TrashModal } from '@/components/TrashModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';

function App() {
  const {
    fetchWorkspaces,
    fetchTasks,
    currentPage,
    showNewTaskModal,
    showNewWorkspaceModal,
    showTrash,
    editingTask,
  } = useStore();

  useEffect(() => {
    fetchWorkspaces().then(() => {
      fetchTasks();
    });
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
        return <KanbanBoard />;
      case 'plans':
        return <PlansPage />;
      case 'rules':
        return <RulesPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>

      {/* Modals */}
      {showNewTaskModal && <NewTaskModal />}
      {showNewWorkspaceModal && <NewWorkspaceModal />}
      {showTrash && <TrashModal />}
      {editingTask && <TaskDetailModal />}
    </div>
  );
}

export default App;
