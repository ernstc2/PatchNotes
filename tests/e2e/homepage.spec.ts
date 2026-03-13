import { test, expect } from '@playwright/test';

test('homepage renders feed content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
});

test('unknown route shows 404 page', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-xyz');
  await expect(page.getByText(/not found/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /return home/i })).toBeVisible();
});
