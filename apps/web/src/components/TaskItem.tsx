import type { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggleDone?: (id: string) => void;
}

export function TaskItem({ task, onToggleDone }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
      <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleDone?.(task.id)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
        />
        <span
          className={task.done ? 'text-slate-400 line-through' : 'text-slate-800'}
        >
          {task.title}
        </span>
      </label>
    </li>
  );
}
