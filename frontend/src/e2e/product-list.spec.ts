import { expect, test } from '@playwright/test';

test.describe('product list', () => {
  test('shows heading and register control', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Tus productos')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Registrar movimiento' }),
    ).toBeVisible();
  });
});
