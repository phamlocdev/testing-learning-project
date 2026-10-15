import type { Task } from '@/types/task';
import { authedFetch } from './http';

export async function createTask(token: string, input: { title: string }): Promise<Task> {
  const response = await authedFetch(token, '/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task (status ${response.status})`);
  }

  return response.json();
}

export async function listTasks(token: string): Promise<Task[]> {
  const response = await authedFetch(token, '/tasks');

  if (!response.ok) {
    throw new Error(`Failed to list tasks (status ${response.status})`);
  }

  return response.json();
}

export async function setTaskDone(token: string, id: string, done: boolean): Promise<Task> {
  const response = await authedFetch(token, `/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task (status ${response.status})`);
  }

  return response.json();
}
