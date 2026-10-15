import type { FormEvent } from 'react';
import { useTaskTitleForm } from '@/hooks/useTaskTitleForm';
import { createTask } from '@/lib/api/tasks';
import type { Task } from '@/types/task';

interface CreateTaskFormProps {
  ownerId: string;
  onCreated: (task: Task) => void;
}

export function CreateTaskForm({ ownerId, onCreated }: CreateTaskFormProps) {
  const { title, error, setTitle, validate } = useTaskTitleForm();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const task = await createTask({ title, ownerId });
    onCreated(task);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Task title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Add task</button>
    </form>
  );
}
