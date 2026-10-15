import { API_BASE_URL } from './http';

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to log in (status ${response.status})`);
  }

  return response.json();
}

export async function registerUser(input: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to register (status ${response.status})`);
  }

  return response.json();
}
