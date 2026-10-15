'use client';

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <label className="flex-1 text-sm font-medium text-slate-700">
        Task title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Write report"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </label>
      <button
        type="submit"
        className="shrink-0 self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 sm:mt-6"
      >
        Add task
      </button>
    </form>
  );
}
