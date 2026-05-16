import type { Task, TaskStatus } from '../types/task';
import { Column } from './Column';

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

type Props = {
  tasks: Task[];
  draggingId: number | null;
  onSelect?: (task: Task) => void;
  onDragStart: (id: number) => void;
  onDropOnColumn: (status: TaskStatus, targetIndex: number) => void;
};

export function Board({ tasks, draggingId, onSelect, onDragStart, onDropOnColumn }: Props) {
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
        />
      ))}
    </div>
  );
}
