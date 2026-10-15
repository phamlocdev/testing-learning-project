import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { server } from '@/mocks/server';
import { LoginForm } from './LoginForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function TestHarness() {
  const { user } = useAuth();
  return user ? <p>Logged in as {user.email}</p> : <LoginForm />;
}

describe('LoginForm (integration)', () => {
  it('logs the user in and exposes the authenticated user via context', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // Assert
    expect(await screen.findByText(/Logged in as/)).toBeInTheDocument();
  });

  it('shows an error when the credentials are rejected', async () => {
    // Arrange
    server.use(
      http.post('http://localhost:3001/auth/login', () =>
        HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('shows a validation error for an invalid email, without calling the API', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>,
    );

    // Act
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address');
  });
});
