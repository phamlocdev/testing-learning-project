import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from './TaskList';
import { MOCK_ACCESS_TOKEN } from '@/mocks/fake-jwt';

describe('TaskList (integration)', () => {
  it('submits the form, calls the API, and shows the new task in the list', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskList token={MOCK_ACCESS_TOKEN} />);

    // Act
    await user.type(screen.getByLabelText('Task title'), 'Write report');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    // Assert
    expect(await screen.findByText('Write report')).toBeInTheDocument();
  });

  it('clears the input after a task is created', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskList token={MOCK_ACCESS_TOKEN} />);

    // Act
    const input = screen.getByLabelText('Task title');
    await user.type(input, 'Write report');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    await screen.findByText('Write report');

    // Assert
    expect(input).toHaveValue('');
  });

  it('shows a validation error and does not add a task when the title is empty', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskList token={MOCK_ACCESS_TOKEN} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
