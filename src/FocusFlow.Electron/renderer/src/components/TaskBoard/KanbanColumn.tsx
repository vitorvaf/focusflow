import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TaskItemDto, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../types';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  boardId: number;
  tasks: TaskItemDto[];
  onSelectTask: (taskId: number) => void;
  onCreateTask: (data: CreateTaskRequest) => Promise<void>;
}

export function KanbanColumn({ title, status, boardId, tasks, onSelectTask, onCreateTask }: KanbanColumnProps) {
  const [showForm, setShowForm] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: status });

  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const taskIds = sortedTasks.map(t => t.id);

  const handleCreate = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    await onCreateTask({ ...(data as CreateTaskRequest), boardId });
    setShowForm(false);
  };

  return (
    <div className="flex w-64 shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-xs text-gray-600 bg-gray-800 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[4rem] rounded-xl p-2 transition-colors ${
          isOver ? 'bg-gray-700/50 ring-1 ring-indigo-500' : 'bg-gray-800/40'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
            />
          ))}
        </SortableContext>

        {sortedTasks.length === 0 && !showForm && (
          <p className="text-xs text-gray-600 text-center py-2">Sem tarefas</p>
        )}
      </div>

      {/* Add task */}
      {showForm ? (
        <TaskForm
          boardId={boardId}
          defaultStatus={status}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Adicionar tarefa
        </button>
      )}
    </div>
  );
}
