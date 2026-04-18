import { useState } from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { ProjectForm } from './ProjectForm';

export type ActiveView = 'board' | 'timer' | 'stats' | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
}

function BoardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg 
      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { projects, selectedProject, selectProject, isLoading } = useProjectContext();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | undefined>(undefined);

  const openCreateProjectForm = () => {
    setEditingProjectId(undefined);
    setShowProjectForm(true);
  };

  const openEditProjectForm = (projectId: number) => {
    setEditingProjectId(projectId);
    setShowProjectForm(true);
  };

  const closeProjectForm = () => {
    setShowProjectForm(false);
    setEditingProjectId(undefined);
  };

  const navItems: NavItem[] = [
    { id: 'board',    label: 'Quadro',        icon: <BoardIcon /> },
    { id: 'timer',    label: 'Timer',         icon: <TimerIcon /> },
    { id: 'stats',    label: 'Estatísticas',  icon: <StatsIcon /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> },
  ];

  return (
    <>
      <nav className="flex flex-col w-56 shrink-0 h-full border-r border-gray-700 bg-gray-900">
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200"
            >
              <ChevronIcon expanded={projectsExpanded} />
              Projetos
            </button>

            {projectsExpanded && (
              <div className="mt-1 space-y-1">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => selectProject(project.id)}
                        className={`flex items-center gap-3 flex-1 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          selectedProject?.id === project.id
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: project.color + '20',
                            color: project.color
                          }}
                        >
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{project.name}</span>
                        <span className={`text-xs ${selectedProject?.id === project.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {project.taskCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditProjectForm(project.id)}
                        className={`p-1 rounded text-xs transition-colors ${
                          selectedProject?.id === project.id
                            ? 'text-indigo-100 hover:text-white hover:bg-indigo-500/40'
                            : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                        title={`Editar projeto ${project.name}`}
                        aria-label={`Editar projeto ${project.name}`}
                      >
                        <EditIcon />
                      </button>
                    </div>
                  ))
                )}

                <button
                  onClick={openCreateProjectForm}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                >
                  <PlusIcon />
                  Novo Projeto
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-2 mt-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  activeView === item.id
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {showProjectForm && (
        <ProjectForm projectId={editingProjectId} onClose={closeProjectForm} />
      )}
    </>
  );
}
