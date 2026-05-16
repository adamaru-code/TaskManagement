export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskCreateInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
};

export type TaskUpdateInput = TaskCreateInput;

export type TaskReorderItem = {
  id: number;
  status: TaskStatus;
  displayOrder: number;
};
