import { test, expect } from '@playwright/test';

test('sign-in page renders form', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('sign-up page renders form', async ({ page }) => {
  await page.goto('/sign-up');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
