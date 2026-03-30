import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskItemDto } from '../../types';

interface TaskCardProps {
  task: TaskItemDto;
  onSelect: (taskId: number) => void;
}

const PRIORITY_STYLES: Record<TaskItemDto['priority'], string> = {
  Low:    'bg-gray-700 text-gray-300',
  Medium: 'bg-yellow-900 text-yellow-300',
  High:   'bg-orange-900 text-orange-300',
  Urgent: 'bg-red-900 text-red-300',
};

const PRIORITY_LABELS: Record<TaskItemDto['priority'], string> = {
  Low:    'Baixa',
  Medium: 'Média',
  High:   'Alta',
  Urgent: 'Urgente',
};

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status, sortOrder: task.sortOrder },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task.id)}
      className="rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-sm hover:border-gray-600 hover:shadow-md transition-all cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-medium leading-snug ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
          {task.title}
        </h3>
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        {task.estimatedPomodoros > 0 && (
          <span>🍅 {task.completedPomodoros}/{task.estimatedPomodoros}</span>
        )}
        {task.dueDate && (
          <span className="text-gray-600">
            📅 {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
