import { expect, test } from '@playwright/test';

test('navigates between the login and register pages via the footer links', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/register$/);

  await page.getByRole('link', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('registers a new account and lands on the task list', async ({ page }) => {
  const email = `e2e-register-${Date.now()}@example.com`;

  await page.goto('/register');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('correct-password');
  await page.getByLabel('Confirm password').fill('correct-password');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Mini Task Manager' })).toBeVisible();
});

test('shows an error when registering with an email that is already taken', async ({ page }) => {
  const email = `e2e-register-${Date.now()}@example.com`;

  // Arrange: register once via the UI
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('correct-password');
  await page.getByLabel('Confirm password').fill('correct-password');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/$/);

  // Act: log out and try to register the same email again
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('another-password');
  await page.getByLabel('Confirm password').fill('another-password');
  await page.getByRole('button', { name: 'Register' }).click();

  // Assert
  // (not `getByRole('alert')`: Next.js injects its own hidden route-announcer div with
  // the same role on every page, so a role-based query here would match two elements)
  await expect(page.getByText('An account with this email already exists')).toBeVisible();
});
