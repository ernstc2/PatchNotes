import { test, expect } from '@playwright/test';

test('homepage with search query renders', async ({ page }) => {
  await page.goto('/?q=act');
  await expect(page.locator('main')).toBeVisible();
});
