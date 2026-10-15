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
    <div>
      <CreateTaskForm ownerId={ownerId} onCreated={handleCreated} />
      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  );
}
