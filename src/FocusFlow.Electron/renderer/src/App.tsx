import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Sidebar, type ActiveView } from './components/Layout/Sidebar';
import { KanbanBoard } from './components/TaskBoard/KanbanBoard';
import { PomodoroTimer } from './components/PomodoroTimer/PomodoroTimer';
import { StatsPanel } from './components/Stats/StatsPanel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { MiniTimer } from './components/MiniTimer/MiniTimer';
import { useTasks } from './hooks/useTasks';
import { useSettings } from './hooks/useSettings';
import './styles/global.css';

const ACTIVE_BOARD_ID = 1;

function MainApp() {
  const [activeView, setActiveView]     = useState<ActiveView>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { settings, toggleDark } = useSettings();
  const { tasks, refetch: refetchTasks } = useTasks(ACTIVE_BOARD_ID);

  // Apply dark mode class on initial load
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTaskSelectedForTimer = (taskId: number) => {
    setSelectedTaskId(taskId);
    setActiveView('timer');
  };

  const handleTaskUpdated = (taskId: number) => {
    void refetchTasks();
    void taskId;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <Header
        boardName="Meu Board"
        darkMode={settings.darkMode}
        onToggleDark={toggleDark}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-auto">
          {activeView === 'board' && (
            <KanbanBoard
              boardId={ACTIVE_BOARD_ID}
              onTaskSelectedForTimer={handleTaskSelectedForTimer}
            />
          )}
          {activeView === 'timer' && (
            <PomodoroTimer
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onTaskUpdated={handleTaskUpdated}
            />
          )}
          {activeView === 'stats'    && <StatsPanel />}
          {activeView === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/mini-timer" element={<MiniTimer />} />
      </Routes>
    </HashRouter>
  );
}
