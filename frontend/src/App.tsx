import { useEffect, useState } from 'react';
import './App.css';
import { createTask, fetchTasks, updateTask } from './api/tasks';
import type { Task, TaskCreateInput, TaskUpdateInput } from './types/task';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { TaskModal } from './components/TaskModal';
import { TaskForm } from './components/TaskForm';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onAddClick={() => setIsCreateOpen(true)} />
      <main>
        {loading && <p className="p-6 text-slate-600">読み込み中...</p>}
        {error && (
          <p className="p-6 text-red-600">タスクの取得に失敗しました: {error}</p>
        )}
        {!loading && !error && <Board tasks={tasks} onSelect={setEditingTask} />}
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
