import { createContext, useContext, type ReactNode } from 'react';
import { useProject, type UseProjectReturn } from '../hooks/useProject';

const ProjectContext = createContext<UseProjectReturn | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const projectState = useProject();
  return (
    <ProjectContext.Provider value={projectState}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext(): UseProjectReturn {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider');
  }
  return context;
}
