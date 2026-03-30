import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useTasks } from '../../hooks/useTasks';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import type { TaskItemDto, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../types';

interface KanbanBoardProps {
  boardId: number;
  onTaskSelectedForTimer?: (taskId: number) => void;
}

interface EditModalState {
  task: TaskItemDto;
}

const COLUMNS: { title: string; status: TaskStatus }[] = [
  { title: 'Backlog',      status: 'Backlog' },
  { title: 'A Fazer',      status: 'Todo' },
  { title: 'Em Progresso', status: 'InProgress' },
  { title: 'Concluído',    status: 'Done' },
];

export function KanbanBoard({ boardId, onTaskSelectedForTimer }: KanbanBoardProps) {
  const { tasks, loading, error, create, update, updateStatus, reorder, remove } = useTasks(boardId);
  const [activeTask, setActiveTask] = useState<TaskItemDto | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = ({ active }: { active: { id: number | string } }) => {
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    const overId = over.id;

    // Check if dropped over a column (TaskStatus string) or another task
    const columnStatuses = COLUMNS.map(c => c.status) as string[];
    const targetStatus = columnStatuses.includes(String(overId))
      ? (String(overId) as TaskStatus)
      : tasks.find(t => t.id === overId)?.status;

    if (!targetStatus) return;

    if (targetStatus !== draggedTask.status) {
      // Cross-column move
      await updateStatus(draggedTask.id, targetStatus);
    } else if (typeof overId === 'number' && overId !== draggedTask.id) {
      // Same-column reorder
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) await reorder(draggedTask.id, overTask.sortOrder);
    }
  };

  const handleSelectTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) setEditModal({ task });
  };

  const handleEditSubmit = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (!editModal) return;
    await update(editModal.task.id, data as UpdateTaskRequest);
    setEditModal(null);
  };

  const handleDelete = async () => {
    if (!editModal) return;
    if (!confirm(`Remover "${editModal.task.title}"?`)) return;
    await remove(editModal.task.id);
    setEditModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto p-4 flex-1">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              boardId={boardId}
              tasks={tasks.filter(t => t.status === col.status)}
              onSelectTask={handleSelectTask}
              onCreateTask={async (data) => { await create(data); }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 shadow-2xl opacity-90">
              <TaskCard task={activeTask} onSelect={() => undefined} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit modal */}
      {editModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-100">Editar tarefa</h2>
              <div className="flex gap-2">
                {onTaskSelectedForTimer && (
                  <button
                    onClick={() => { onTaskSelectedForTimer(editModal.task.id); setEditModal(null); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                    title="Iniciar no timer"
                  >
                    🍅 Timer
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  Remover
                </button>
              </div>
            </div>
            <TaskForm
              boardId={boardId}
              initialValues={{
                title: editModal.task.title,
                description: editModal.task.description ?? '',
                priority: editModal.task.priority,
                estimatedPomodoros: editModal.task.estimatedPomodoros,
                dueDate: editModal.task.dueDate?.split('T')[0] ?? '',
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
