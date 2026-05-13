import type { Task } from '../types/task';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
