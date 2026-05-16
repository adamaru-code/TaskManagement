import { useEffect, useState } from 'react';
import './App.css';
import { createTask, fetchTasks, reorderTasks, updateTask } from './api/tasks';
import type { Task, TaskCreateInput, TaskStatus, TaskUpdateInput } from './types/task';
import { Header } from './components/Header';
import { Board } from './components/Board';
import type { SortKey } from './components/Column';

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
import { TaskModal } from './components/TaskModal';
import { TaskForm } from './components/TaskForm';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks()
      .then((data) => setTasks(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(input: TaskCreateInput) {
    await createTask(input);
    const data = await fetchTasks();
    setTasks(data);
    setIsCreateOpen(false);
  }

  async function handleUpdate(input: TaskUpdateInput) {
    if (!editingTask) return;
    const updated = await updateTask(editingTask.id, input);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
  }

  async function handleDrop(targetStatus: TaskStatus, targetIndex: number) {
    const draggedId = draggingId;
    setDraggingId(null);
    if (draggedId == null) return;
    const dragged = tasks.find((t) => t.id === draggedId);
    if (!dragged) return;

    const sourceStatus = dragged.status;
    const sourceCol = tasks
      .filter((t) => t.status === sourceStatus)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const targetCol =
      sourceStatus === targetStatus
        ? sourceCol
        : tasks
            .filter((t) => t.status === targetStatus)
            .sort((a, b) => a.displayOrder - b.displayOrder);

    const fromIndex = sourceCol.findIndex((t) => t.id === draggedId);
    let insertIndex = targetIndex;
    if (sourceStatus === targetStatus && fromIndex < targetIndex) {
      insertIndex = targetIndex - 1;
    }
    if (sourceStatus === targetStatus && fromIndex === insertIndex) return;

    const newSource = sourceCol.filter((t) => t.id !== draggedId);
    const newTarget =
      sourceStatus === targetStatus ? newSource : targetCol.slice();
    newTarget.splice(insertIndex, 0, { ...dragged, status: targetStatus });

    const changed = new Map<number, Task>();
    newTarget.forEach((t, i) => {
      changed.set(t.id, { ...t, displayOrder: i, status: targetStatus });
    });
    if (sourceStatus !== targetStatus) {
      newSource.forEach((t, i) => {
        changed.set(t.id, { ...t, displayOrder: i });
      });
    }

    const prevTasks = tasks;
    setTasks((cur) => cur.map((t) => changed.get(t.id) ?? t));

    try {
      await reorderTasks(
        Array.from(changed.values()).map((t) => ({
          id: t.id,
          status: t.status,
          displayOrder: t.displayOrder,
        })),
      );
    } catch (e) {
      setTasks(prevTasks);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSortColumn(status: TaskStatus, key: SortKey) {
    const columnTasks = tasks.filter((t) => t.status === status);
    if (columnTasks.length === 0) return;

    const sorted = [...columnTasks].sort((a, b) => {
      if (key === 'priority') {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }
      if (a.dueDate == null && b.dueDate == null) return 0;
      if (a.dueDate == null) return 1;
      if (b.dueDate == null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    const changed = new Map<number, Task>();
    sorted.forEach((t, i) => {
      if (t.displayOrder !== i) changed.set(t.id, { ...t, displayOrder: i });
    });
    if (changed.size === 0) return;

    const prevTasks = tasks;
    setTasks((cur) => cur.map((t) => changed.get(t.id) ?? t));

    try {
      await reorderTasks(
        Array.from(changed.values()).map((t) => ({
          id: t.id,
          status: t.status,
          displayOrder: t.displayOrder,
        })),
      );
    } catch (e) {
      setTasks(prevTasks);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onAddClick={() => setIsCreateOpen(true)} />
      <main>
        {loading && <p className="p-6 text-slate-600">読み込み中...</p>}
        {error && (
          <p className="p-6 text-red-600">エラー: {error}</p>
        )}
        {!loading && (
          <Board
            tasks={tasks}
            draggingId={draggingId}
            onSelect={setEditingTask}
            onDragStart={setDraggingId}
            onDropOnColumn={handleDrop}
            onSort={handleSortColumn}
          />
        )}
      </main>
      {isCreateOpen && (
        <TaskModal title="タスクを追加" onClose={() => setIsCreateOpen(false)}>
          <TaskForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
        </TaskModal>
      )}
      {editingTask && (
        <TaskModal title="タスクを編集" onClose={() => setEditingTask(null)}>
          <TaskForm
            initial={editingTask}
            submitLabel="更新する"
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        </TaskModal>
      )}
    </div>
  );
}

export default App;
