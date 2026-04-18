/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseProjectReturn } from '../../hooks/useProject';
import { useProjectContext } from '../../contexts/ProjectContext';
import { ProjectForm } from './ProjectForm';

vi.mock('../../contexts/ProjectContext', () => ({
  useProjectContext: vi.fn(),
}));

const mockedUseProjectContext = vi.mocked(useProjectContext);

const baseProjects = [
  {
    id: 1,
    name: 'Geral',
    vaultPath: null,
    color: '#6366f1',
    taskCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Projeto Atual',
    vaultPath: null,
    color: '#22c55e',
    taskCount: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Projeto Destino',
    vaultPath: null,
    color: '#3b82f6',
    taskCount: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function buildProjectContext(overrides: Partial<UseProjectReturn> = {}): UseProjectReturn {
  return {
    projects: baseProjects,
    selectedProject: baseProjects[1],
    selectProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(async () => undefined),
    refreshProjects: vi.fn(async () => undefined),
    isLoading: false,
    error: null,
    ...overrides,
  };
}

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('requires destination project before deleting project with tasks', async () => {
    const context = buildProjectContext();
    mockedUseProjectContext.mockReturnValue(context);

    render(<ProjectForm projectId={2} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(screen.getByText('Selecione um projeto de destino para mover as tarefas antes de excluir.')).toBeInTheDocument();
    await waitFor(() => {
      expect(context.deleteProject).not.toHaveBeenCalled();
    });
  });

  it('deletes project with tasks and selected destination project', async () => {
    const deleteProject = vi.fn(async () => undefined);
    const onClose = vi.fn();
    mockedUseProjectContext.mockReturnValue(buildProjectContext({ deleteProject }));

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProjectForm projectId={2} onClose={onClose} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith(2, 3);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(confirmSpy).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('deletes project without tasks without requiring destination', async () => {
    const deleteProject = vi.fn(async () => undefined);
    const onClose = vi.fn();

    const projectsWithoutTasks = baseProjects.map(project =>
      project.id === 2 ? { ...project, taskCount: 0 } : project,
    );

    mockedUseProjectContext.mockReturnValue(
      buildProjectContext({
        projects: projectsWithoutTasks,
        selectedProject: projectsWithoutTasks[1],
        deleteProject,
      }),
    );

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProjectForm projectId={2} onClose={onClose} />);

    expect(screen.queryByText(/Este projeto possui/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith(2, undefined);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(confirmSpy).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
