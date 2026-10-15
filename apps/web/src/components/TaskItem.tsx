import type { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggleDone?: (id: string) => void;
}

export function TaskItem({ task, onToggleDone }: TaskItemProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleDone?.(task.id)}
        />
        <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.title}
        </span>
      </label>
    </li>
  );
}
