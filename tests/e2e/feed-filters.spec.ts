import { test, expect } from '@playwright/test';

test.describe('Feed filter interactions', () => {
  test('type filter updates URL when option selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Open the Type select (first combobox, shows placeholder "Type") and choose Executive Orders
    await page.getByRole('combobox').filter({ hasText: 'Type' }).click();
    await page.getByRole('option', { name: 'Executive Orders' }).click();

    await expect(page).toHaveURL(/[?&]type=executive_order/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('type filter clears URL param when All types selected', async ({ page }) => {
    await page.goto('/?type=executive_order');
    await expect(page.locator('main')).toBeVisible();

    // Open the Type select (shows raw value "executive_order" when active) and choose All types
    await page.getByRole('combobox').filter({ hasText: 'executive_order' }).click();
    await page.getByRole('option', { name: 'All types' }).click();

    await expect(page).not.toHaveURL(/type=/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('topic filter updates URL when option selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Open the Topic select and choose Healthcare
    await page.getByRole('combobox').filter({ hasText: 'Topic' }).click();
    await page.getByRole('option', { name: 'Healthcare' }).click();

    await expect(page).toHaveURL(/[?&]topic=healthcare/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('sort filter updates URL when option selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Open the Sort select and choose Oldest First
    await page.getByRole('combobox').filter({ hasText: 'Sort' }).click();
    await page.getByRole('option', { name: 'Oldest First' }).click();

    await expect(page).toHaveURL(/[?&]sort=asc/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('multiple filters combine in URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Set type to Bills
    await page.getByRole('combobox').filter({ hasText: 'Type' }).click();
    await page.getByRole('option', { name: 'Bills' }).click();
    await expect(page).toHaveURL(/[?&]type=bill/);

    // Set topic to Healthcare
    await page.getByRole('combobox').filter({ hasText: 'Topic' }).click();
    await page.getByRole('option', { name: 'Healthcare' }).click();

    await expect(page).toHaveURL(/[?&]type=bill/);
    await expect(page).toHaveURL(/[?&]topic=healthcare/);
    await expect(page.locator('main')).toBeVisible();
  });
});
