import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { server } from '@/mocks/server';
import { RegisterForm } from './RegisterForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function TestHarness() {
  const { user } = useAuth();
  return user ? <p>Logged in as {user.email}</p> : <RegisterForm />;
}

describe('RegisterForm (integration)', () => {
  it('registers, logs the new user in, and exposes them via context', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'new-user@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.type(screen.getByLabelText('Confirm password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    // Assert
    expect(await screen.findByText(/Logged in as/)).toBeInTheDocument();
  });

  it('shows a validation error when the passwords do not match', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'new-user@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.type(screen.getByLabelText('Confirm password'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
  });

  it('shows a validation error when the password is too short', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'new-user@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password must be at least 8 characters',
    );
  });

  it('shows an error when the email is already registered', async () => {
    // Arrange
    server.use(
      http.post('http://localhost:3001/auth/register', () =>
        HttpResponse.json({ message: 'An account with this email already exists' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'taken@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.type(screen.getByLabelText('Confirm password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists',
    );
  });
});
