import type { Task, TaskStatus } from '../types/task';
import { Column } from './Column';

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

type Props = { tasks: Task[]; onSelect?: (task: Task) => void };

export function Board({ tasks, onSelect }: Props) {
  return (
    <div className="flex gap-4 p-6">
      {COLUMNS.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
