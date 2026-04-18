import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Sidebar, type ActiveView } from './components/Layout/Sidebar';
import { KanbanBoard } from './components/TaskBoard/KanbanBoard';
import { PomodoroTimer } from './components/PomodoroTimer/PomodoroTimer';
import { StatsPanel } from './components/Stats/StatsPanel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { MiniTimer } from './components/MiniTimer/MiniTimer';
import { ProjectProvider, useProjectContext } from './contexts/ProjectContext';
import { useSettings } from './hooks/useSettings';
import './styles/global.css';

function MainApp() {
  const [activeView, setActiveView]     = useState<ActiveView>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { selectedProject, isLoading: projectsLoading } = useProjectContext();
  const { settings, toggleDark } = useSettings();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  const handleTaskSelectedForTimer = (taskId: number) => {
    setSelectedTaskId(taskId);
    setActiveView('timer');
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <Header
        projectName={selectedProject?.name ?? 'Projeto'}
        projectColor={selectedProject?.color}
        darkMode={settings.darkMode}
        onToggleDark={toggleDark}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-auto">
          {activeView === 'board' && selectedProject && (
            <KanbanBoard
              key={`board-${selectedProject.id}`}
              projectId={selectedProject.id}
              projectColor={selectedProject.color}
              projectName={selectedProject.name}
              onTaskSelectedForTimer={handleTaskSelectedForTimer}
            />
          )}
          {activeView === 'timer' && selectedProject && (
            <PomodoroTimer
              key={`timer-${selectedProject.id}`}
              projectId={selectedProject.id}
              projectColor={selectedProject.color}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          )}
          {activeView === 'stats'    && <StatsPanel projectId={selectedProject?.id} />}
          {activeView === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ProjectProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/mini-timer" element={<MiniTimer />} />
        </Routes>
      </HashRouter>
    </ProjectProvider>
  );
}
