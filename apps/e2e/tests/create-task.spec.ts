import { expect, test } from '@playwright/test';

test('creates a task through the real UI and API and sees it in the list', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Task title').fill(`E2E smoke task ${Date.now()}`);
  await page.getByRole('button', { name: 'Add task' }).click();

  await expect(page.getByText(/E2E smoke task \d+/)).toBeVisible();
});
