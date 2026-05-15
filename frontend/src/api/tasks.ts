import type { Task, TaskCreateInput } from '../types/task';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    if (res.status === 400) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; errors?: Record<string, string> }
        | null;
      const detail = body?.errors
        ? Object.entries(body.errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' / ')
        : body?.message ?? 'Validation failed';
      throw new Error(detail);
    }
    throw new Error(`Failed to create task: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
