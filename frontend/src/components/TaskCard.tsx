import type { Task, TaskPriority } from '../types/task';

const priorityBadge: Record<TaskPriority, { emoji: string; label: string; border: string }> = {
  high: { emoji: '🔴', label: 'High', border: 'border-l-red-500' },
  medium: { emoji: '🟢', label: 'Medium', border: 'border-l-green-500' },
  low: { emoji: '🟡', label: 'Low', border: 'border-l-yellow-500' },
};

type Props = {
  task: Task;
  index: number;
  onSelect?: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDropOnCard: (targetIndex: number) => void;
  isDragging: boolean;
};

export function TaskCard({ task, index, onSelect, onDragStart, onDropOnCard, isDragging }: Props) {
  const p = priorityBadge[task.priority];
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={() => onSelect?.(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect?.(task);
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(task.id));
        onDragStart(task.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropOnCard(index);
      }}
      className={`bg-white rounded-md shadow-sm border border-slate-200 border-l-4 ${p.border} p-3 mb-2 cursor-grab active:cursor-grabbing hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="font-medium text-slate-800">{task.title}</div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          {p.emoji} {p.label}
        </span>
        {task.dueDate && <span className="inline-flex items-center gap-1">📅 {task.dueDate}</span>}
      </div>
    </div>
  );
}
