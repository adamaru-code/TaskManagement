import type { Task, TaskStatus } from '../types/task';
import { Column, type SortKey } from './Column';

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

type Props = {
  tasks: Task[];
  draggingId: number | null;
  onSelect?: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDropOnColumn: (status: TaskStatus, targetIndex: number) => void;
  onSort: (status: TaskStatus, key: SortKey) => void;
  onAddClick: () => void;
};

export function Board({ tasks, draggingId, onSelect, onDragStart, onDropOnColumn, onSort, onAddClick }: Props) {
  return (
    <div className="flex gap-4 p-6">
      {COLUMNS.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          draggingId={draggingId}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDropOnColumn={onDropOnColumn}
          onSort={onSort}
          onAddClick={status === 'todo' ? onAddClick : undefined}
        />
      ))}
    </div>
  );
}
