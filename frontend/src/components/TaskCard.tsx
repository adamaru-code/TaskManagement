import type { Task, TaskPriority } from '../types/task';

const priorityBadge: Record<TaskPriority, { emoji: string; label: string; border: string }> = {
  high: { emoji: '🔴', label: 'High', border: 'border-l-red-500' },
  medium: { emoji: '🟡', label: 'Medium', border: 'border-l-yellow-500' },
  low: { emoji: '🟢', label: 'Low', border: 'border-l-green-500' },
};

type Props = { task: Task; onSelect?: (task: Task) => void };

export function TaskCard({ task, onSelect }: Props) {
  const p = priorityBadge[task.priority];
  return (
    <button
      type="button"
      onClick={() => onSelect?.(task)}
      className={`w-full text-left bg-white rounded-md shadow-sm border border-slate-200 border-l-4 ${p.border} p-3 mb-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400`}
    >
      <div className="font-medium text-slate-800">{task.title}</div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          {p.emoji} {p.label}
        </span>
        {task.dueDate && <span className="inline-flex items-center gap-1">📅 {task.dueDate}</span>}
      </div>
    </button>
  );
}
