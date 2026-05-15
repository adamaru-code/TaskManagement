import { useEffect, useState } from 'react';
import './App.css';
import { createTask, fetchTasks } from './api/tasks';
import type { Task, TaskCreateInput } from './types/task';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { TaskModal } from './components/TaskModal';
import { TaskForm } from './components/TaskForm';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onAddClick={() => setIsModalOpen(true)} />
      <main>
        {loading && <p className="p-6 text-slate-600">読み込み中...</p>}
        {error && (
          <p className="p-6 text-red-600">タスクの取得に失敗しました: {error}</p>
        )}
        {!loading && !error && <Board tasks={tasks} />}
      </main>
      {isModalOpen && (
        <TaskModal title="タスクを追加" onClose={() => setIsModalOpen(false)}>
          <TaskForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
        </TaskModal>
      )}
    </div>
  );
}

export default App;
