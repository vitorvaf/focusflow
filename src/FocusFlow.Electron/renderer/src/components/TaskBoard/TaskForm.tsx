import { useState } from 'react';
import type { CreateTaskRequest, TaskPriority, TaskStatus, UpdateTaskRequest } from '../../types';

interface TaskFormProps {
  boardId: number;
  defaultStatus?: TaskStatus;
  initialValues?: {
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedPomodoros: number;
    dueDate: string;
  };
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'Low',    label: 'Baixa' },
  { value: 'Medium', label: 'Média' },
  { value: 'High',   label: 'Alta' },
  { value: 'Urgent', label: 'Urgente' },
];

export function TaskForm({ boardId, defaultStatus, initialValues, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle]           = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priority, setPriority]     = useState<TaskPriority>(initialValues?.priority ?? 'Medium');
  const [estimated, setEstimated]   = useState(initialValues?.estimatedPomodoros ?? 1);
  const [dueDate, setDueDate]       = useState(initialValues?.dueDate ?? '');
  const [saving, setSaving]         = useState(false);

  const isEdit = Boolean(initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await onSubmit({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          estimatedPomodoros: estimated,
          dueDate: dueDate || undefined,
        } satisfies UpdateTaskRequest);
      } else {
        await onSubmit({
          boardId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          estimatedPomodoros: estimated,
          dueDate: dueDate || undefined,
        } satisfies CreateTaskRequest);
      }
    } finally {
      setSaving(false);
    }
  };

  void defaultStatus; // Used by KanbanColumn to set initial status

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-3 bg-gray-800 rounded-xl border border-gray-700"
    >
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título da tarefa..."
        className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoFocus
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Descrição (opcional)..."
        rows={2}
        className="w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as TaskPriority)}
          className="flex-1 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 px-2 py-1.5 text-xs"
        >
          {PRIORITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">🍅</span>
          <input
            type="number"
            min={0}
            max={20}
            value={estimated}
            onChange={e => setEstimated(Number(e.target.value))}
            className="w-14 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 px-2 py-1.5 text-xs text-center"
          />
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="flex-1 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 px-2 py-1.5 text-xs"
        />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}
