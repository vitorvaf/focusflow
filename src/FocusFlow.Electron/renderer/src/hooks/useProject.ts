import { useState, useEffect, useCallback } from 'react';
import type { ProjectDto, CreateProjectRequest, UpdateProjectRequest } from '../types';
import { projectsApi } from '../services/api';

export interface UseProjectReturn {
  projects: ProjectDto[];
  selectedProject: ProjectDto | null;
  selectProject: (id: number) => void;
  createProject: (data: CreateProjectRequest) => Promise<ProjectDto>;
  updateProject: (id: number, data: UpdateProjectRequest) => Promise<ProjectDto>;
  deleteProject: (id: number) => Promise<void>;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'focusflow_selected_project_id';

export function useProject(): UseProjectReturn {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await projectsApi.list();
      setProjects(data);

      if (data.length > 0) {
        const savedId = localStorage.getItem(STORAGE_KEY);
        const targetId = savedId ? parseInt(savedId, 10) : null;
        
        const target = targetId ? data.find(p => p.id === targetId) : null;
        const projectToSelect = target || data[0];
        
        setSelectedProjectId(projectToSelect.id);
        setSelectedProject(projectToSelect);
        localStorage.setItem(STORAGE_KEY, String(projectToSelect.id));
      } else {
        setSelectedProjectId(null);
        setSelectedProject(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const selectProject = useCallback((id: number) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setSelectedProjectId(id);
      setSelectedProject(project);
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, [projects]);

  const createProject = useCallback(async (data: CreateProjectRequest): Promise<ProjectDto> => {
    const newProject = await projectsApi.create(data);
    await refreshProjects();
    selectProject(newProject.id);
    return newProject;
  }, [refreshProjects, selectProject]);

  const updateProject = useCallback(async (id: number, data: UpdateProjectRequest): Promise<ProjectDto> => {
    const updated = await projectsApi.update(id, data);
    await refreshProjects();
    if (selectedProjectId === id) {
      setSelectedProject(updated);
    }
    return updated;
  }, [refreshProjects, selectedProjectId]);

  const deleteProject = useCallback(async (id: number): Promise<void> => {
    await projectsApi.delete(id);
    if (selectedProjectId === id) {
      localStorage.removeItem(STORAGE_KEY);
      setSelectedProjectId(null);
      setSelectedProject(null);
    }
    await refreshProjects();
  }, [refreshProjects, selectedProjectId]);

  return {
    projects,
    selectedProject,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
    isLoading,
    error,
  };
}
