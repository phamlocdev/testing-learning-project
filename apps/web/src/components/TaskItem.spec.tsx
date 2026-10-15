import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem';
import type { Task } from '@/types/task';

describe('TaskItem', () => {
  const pendingTask: Task = {
    id: 't1',
    title: 'Write report',
    ownerId: 'user-A',
    done: false,
  };

  it('renders the task title', () => {
    // Arrange & Act
    render(<TaskItem task={pendingTask} />);

    // Assert
    expect(screen.getByText('Write report')).toBeInTheDocument();
  });

  it('shows an unchecked checkbox when the task is pending', () => {
    // Arrange & Act
    render(<TaskItem task={pendingTask} />);

    // Assert
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('shows a checked checkbox when the task is done', () => {
    // Arrange
    const doneTask: Task = { ...pendingTask, done: true };

    // Act
    render(<TaskItem task={doneTask} />);

    // Assert
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onToggleDone with the task id when the checkbox is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onToggleDone = vi.fn();
    render(<TaskItem task={pendingTask} onToggleDone={onToggleDone} />);

    // Act
    await user.click(screen.getByRole('checkbox'));

    // Assert
    expect(onToggleDone).toHaveBeenCalledWith('t1');
  });
});
