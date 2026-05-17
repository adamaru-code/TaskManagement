import type { Task, TaskCreateInput, TaskReorderItem, TaskUpdateInput } from '../types/task';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function parseValidationError(res: Response, fallback: string): Promise<Error> {
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string; errors?: Record<string, string> }
      | null;
    const detail = body?.errors
      ? Object.entries(body.errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' / ')
      : body?.message ?? 'Validation failed';
    return new Error(detail);
  }
  return new Error(`${fallback}: ${res.status} ${res.statusText}`);
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw await parseValidationError(res, 'Failed to create task');
  }
  return res.json();
}

export async function reorderTasks(items: TaskReorderItem[]): Promise<void> {
  const res = await fetch('/api/tasks/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw await parseValidationError(res, 'Failed to reorder tasks');
  }
}

export async function updateTask(id: number, input: TaskUpdateInput): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw await parseValidationError(res, 'Failed to update task');
  }
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw await parseValidationError(res, 'Failed to delete task');
  }
}
