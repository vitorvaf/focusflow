import { useState } from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';
import type { UpdateProjectRequest } from '../../types';

interface ProjectFormProps {
  projectId?: number;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export function ProjectForm({ projectId, onClose }: ProjectFormProps) {
  const { projects, createProject, updateProject, deleteProject } = useProjectContext();
  const existingProject = projectId ? projects.find(p => p.id === projectId) : null;
  const destinationProjects = projects.filter(project => project.id !== projectId);

  const [name, setName] = useState(existingProject?.name ?? '');
  const [color, setColor] = useState(existingProject?.color ?? PRESET_COLORS[0]);
  const [vaultPath, setVaultPath] = useState(existingProject?.vaultPath ?? '');
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!projectId;
  const hasTasksToMove = (existingProject?.taskCount ?? 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && projectId) {
        const data: UpdateProjectRequest = {
          name: name.trim(),
          color,
          vaultPath: vaultPath.trim() || undefined,
        };
        await updateProject(projectId, data);
      } else {
        await createProject({
          name: name.trim(),
          color,
          vaultPath: vaultPath.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) {
      return;
    }

    if (hasTasksToMove && !targetProjectId) {
      setError('Selecione um projeto de destino para mover as tarefas antes de excluir.');
      return;
    }

    const targetProject = destinationProjects.find(project => project.id === Number(targetProjectId));
    const confirmationMessage = hasTasksToMove
      ? `Tem certeza que deseja excluir este projeto? As tarefas serão movidas para "${targetProject?.name ?? 'projeto selecionado'}".`
      : 'Tem certeza que deseja excluir este projeto?';

    if (!confirm(confirmationMessage)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteProject(projectId, hasTasksToMove ? Number(targetProjectId) : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir projeto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do projeto"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-400">ou escolha uma cor customizada</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Vault Path (opcional)
            </label>
            <input
              type="text"
              value={vaultPath}
              onChange={e => setVaultPath(e.target.value)}
              placeholder="C:\Obsidian\Vault"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Caminho para o vault do Obsidian onde as tarefas serão sincronizadas
            </p>
          </div>

          {isEditing && existingProject?.name !== 'Geral' && hasTasksToMove && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300 mb-2">
                Este projeto possui {existingProject.taskCount} tarefa(s). Escolha para qual projeto elas devem ser movidas antes da exclusão.
              </p>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mover tarefas para
              </label>
              <select
                value={targetProjectId}
                onChange={e => setTargetProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecione um projeto</option>
                {destinationProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            {isEditing && projectId && existingProject?.name !== 'Geral' ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Excluir
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
