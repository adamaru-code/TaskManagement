import { useEffect, useState } from 'react';
import './App.css';
import { fetchTasks } from './api/tasks';
import type { Task } from './types/task';
import { Header } from './components/Header';
import { Board } from './components/Board';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks()
      .then((data) => setTasks(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        {loading && <p className="p-6 text-slate-600">読み込み中...</p>}
        {error && (
          <p className="p-6 text-red-600">タスクの取得に失敗しました: {error}</p>
        )}
        {!loading && !error && <Board tasks={tasks} />}
      </main>
    </div>
  );
}

export default App;
