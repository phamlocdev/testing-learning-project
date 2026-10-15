import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001';

test('logs in, creates a task, marks it done, and logs out', async ({ page }) => {
  // Arrange: seed a user via the API directly — signing up through the UI is a
  // separate concern from this scenario, which only covers login → task → logout.
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'correct-password';

  const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(registerResponse.ok).toBe(true);

  // Act: log in through the real UI
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Act: create a task
  const taskTitle = `E2E task ${Date.now()}`;
  await page.getByLabel('Task title').fill(taskTitle);
  await page.getByRole('button', { name: 'Add task' }).click();

  const taskItem = page.getByRole('listitem').filter({ hasText: taskTitle });
  await expect(taskItem).toBeVisible();

  // Act: mark it done
  const checkbox = taskItem.getByRole('checkbox');
  await checkbox.click();

  // Assert: done state is reflected
  await expect(checkbox).toBeChecked();

  // Act: log out
  await page.getByRole('button', { name: 'Log out' }).click();

  // Assert: redirected back to the login screen
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email')).toBeVisible();
});
