import { expect, test } from '@playwright/test';

test.describe('movement form page', () => {
  test('loads dedicated movement page', async ({ page }) => {
    await page.goto('/movements');
    await expect(page.getByText('Registrar movimiento')).toBeVisible();
  });
});
