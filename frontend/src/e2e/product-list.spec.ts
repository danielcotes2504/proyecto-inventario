import { expect, test } from '@playwright/test';

// UUIDs must satisfy Zod's z.uuid() — version byte in [1-8], variant byte in [89abAB].
const MOCK_PRODUCTS = [
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    name: 'Arroz',
    description: 'Arroz blanco',
    unit: 'KG',
    category: 'Alimentos',
    stock_minimo: 10,
    status: 'ACTIVO',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    stock_actual: 3, // low stock: 3 <= 10, triggers M8 alert
  },
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Aceite',
    description: 'Aceite de oliva',
    unit: 'LITROS',
    category: 'Alimentos',
    stock_minimo: 5,
    status: 'ACTIVO',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    stock_actual: 20, // adequate stock: 20 > 5
  },
];

test.describe('product list', () => {
  test('shows heading and register control', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Tus productos')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Registrar movimiento' }),
    ).toBeVisible();
  });

  test.describe('Flow A – products and stock alerts', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('http://localhost:3000/products', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PRODUCTS),
        }),
      );
    });

    test('renders a table row for each product', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('cell', { name: 'Arroz' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Aceite' })).toBeVisible();
    });

    test('M8 – shows "Stock bajo" badge when stock_actual <= stock_minimo', async ({
      page,
    }) => {
      await page.goto('/');
      const row = page.getByRole('row').filter({ hasText: 'Arroz' });
      const badge = row.getByRole('status');
      await expect(badge).toHaveText('Stock bajo');
      await expect(badge).toHaveAttribute('aria-label', /Atención/);
    });

    test('shows "En orden" badge when stock is sufficient', async ({ page }) => {
      await page.goto('/');
      const row = page.getByRole('row').filter({ hasText: 'Aceite' });
      const badge = row.getByRole('status');
      await expect(badge).toHaveText('En orden');
      await expect(badge).toHaveAttribute('aria-label', /Stock suficiente/);
    });

    test('"Registrar movimiento" button navigates to /movements', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Registrar movimiento' }).click();
      await expect(page).toHaveURL(/\/movements/);
    });
  });
});
