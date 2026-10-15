'use client';

import { useState } from 'react';
import type { Task } from '@/types/task';
import { CreateTaskForm } from './CreateTaskForm';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  ownerId: string;
}

export function TaskList({ ownerId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  function handleCreated(task: Task) {
    setTasks((current) => [...current, task]);
  }

  return (
    <div className="flex flex-col gap-5">
      <CreateTaskForm ownerId={ownerId} onCreated={handleCreated} />
      {tasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No tasks yet — add one above.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
