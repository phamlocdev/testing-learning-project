'use client';

import { useEffect, useState } from 'react';
import { listTasks, setTaskDone } from '@/lib/api/tasks';
import type { Task } from '@/types/task';
import { CreateTaskForm } from './CreateTaskForm';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  token: string;
}

export function TaskList({ token }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    listTasks(token).then(setTasks);
  }, [token]);

  function handleCreated(task: Task) {
    setTasks((current) => [...current, task]);
  }

  async function handleToggleDone(id: string) {
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) {
      return;
    }

    const updated = await setTaskDone(token, id, !task.done);
    setTasks((current) => current.map((candidate) => (candidate.id === id ? updated : candidate)));
  }

  return (
    <div className="flex flex-col gap-5">
      <CreateTaskForm token={token} onCreated={handleCreated} />
      {tasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No tasks yet — add one above.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggleDone={handleToggleDone} />
          ))}
        </ul>
      )}
    </div>
  );
}
