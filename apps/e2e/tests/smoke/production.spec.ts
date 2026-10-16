import { expect, test } from '@playwright/test';

const PROD_API_URL = 'https://testing-learning-project.onrender.com';

test('production: logs in, creates a task, marks it done, and logs out', async ({ page }) => {
  // Arrange: seed a user via the real production API — same approach as the local E2E
  // scenario (register via UI is a separate concern from this flow).
  const email = `prod-smoke-${Date.now()}@example.com`;
  const password = 'correct-password';

  const registerResponse = await fetch(`${PROD_API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(registerResponse.ok).toBe(true);

  // Act: log in through the real UI, on the real deployed frontend
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Act: create a task
  const taskTitle = `prod smoke task ${Date.now()}`;
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
