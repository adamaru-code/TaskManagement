import type { Task, TaskStatus } from '../types/task';
import { TaskCard } from './TaskCard';

const statusMeta: Record<TaskStatus, { label: string; dot: string }> = {
  todo: { label: '未着手', dot: 'bg-slate-400' },
  'in-progress': { label: '進行中', dot: 'bg-blue-500' },
  done: { label: '完了', dot: 'bg-green-500' },
};

export type SortKey = 'priority' | 'dueDate';

type Props = {
  status: TaskStatus;
  tasks: Task[];
  draggingId: number | null;
  onSelect?: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDropOnColumn: (status: TaskStatus, targetIndex: number) => void;
  onSort: (status: TaskStatus, key: SortKey) => void;
};

export function Column({
  status,
  tasks,
  draggingId,
  onSelect,
  onDragStart,
  onDropOnColumn,
  onSort,
}: Props) {
  const meta = statusMeta[status];
  const sorted = [...tasks].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumn(status, sorted.length);
      }}
      className="flex-1 bg-slate-100 rounded-lg p-3 min-w-[280px]"
    >
      <header className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${meta.dot}`} />
          <h2 className="font-semibold text-slate-700">{meta.label}</h2>
        </div>
        <span className="text-xs text-slate-500">{sorted.length}</span>
      </header>
      <div className="flex gap-2 mb-3 px-1">
        <button
          type="button"
          onClick={() => onSort(status, 'priority')}
          className="text-xs rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
        >
          優先度順
        </button>
        <button
          type="button"
          onClick={() => onSort(status, 'dueDate')}
          className="text-xs rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
        >
          期限順
        </button>
      </div>
      <div className="min-h-[40px]">
        {sorted.map((t, i) => (
          <TaskCard
            key={t.id}
            task={t}
            index={i}
            isDragging={draggingId === t.id}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDropOnCard={(targetIndex) => onDropOnColumn(status, targetIndex)}
          />
        ))}
      </div>
    </section>
  );
}
