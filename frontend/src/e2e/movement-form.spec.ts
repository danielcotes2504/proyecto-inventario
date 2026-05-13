import { expect, test  } from '@playwright/test';
import type {Page} from '@playwright/test';

// UUID must satisfy Zod's z.uuid() — version byte in [1-8], variant byte in [89abAB].
const PRODUCT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const PRODUCT_NAME = 'Test Product';

function buildMockProduct(stock_actual: number) {
  return {
    id: PRODUCT_ID,
    name: PRODUCT_NAME,
    description: 'Producto de prueba',
    unit: 'UNIDADES',
    category: 'Test',
    stock_minimo: 5,
    status: 'ACTIVO',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    stock_actual,
  };
}

async function mockProductsApi(page: Page, stock_actual: number) {
  await page.route('http://localhost:3000/products', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([buildMockProduct(stock_actual)]),
    }),
  );
}

async function mockMovementsApi(page: Page) {
  await page.route('http://localhost:3000/movements', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: '{}',
      });
    } else {
      await route.continue();
    }
  });
}

async function selectFromDropdown(page: Page, triggerId: string, optionLabel: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole('option', { name: optionLabel }).click();
}

test.describe('movement form page', () => {
  test('loads dedicated movement page', async ({ page }) => {
    await page.goto('/movements');
    await expect(page.getByText('Registrar movimiento')).toBeVisible();
  });

  test.describe('Flow B – movement registration', () => {
    test('IN movement – submits and redirects to product list', async ({ page }) => {
      await mockProductsApi(page, 50);
      await mockMovementsApi(page);

      await page.goto('/movements');
      // type defaults to IN – no change needed
      await selectFromDropdown(page, 'productId', PRODUCT_NAME);
      await page.locator('#quantity').fill('10');
      await page.getByRole('button', { name: 'Guardar movimiento' }).click();

      await expect(page).toHaveURL(/localhost:5173\/?$/);
    });

    test('valid OUT movement – submits within stock limit and redirects', async ({ page }) => {
      await mockProductsApi(page, 50);
      await mockMovementsApi(page);

      await page.goto('/movements');
      await selectFromDropdown(page, 'type', 'Salida');
      await selectFromDropdown(page, 'productId', PRODUCT_NAME);
      await page.locator('#quantity').fill('5'); // 5 <= 50, valid
      await page.getByRole('button', { name: 'Guardar movimiento' }).click();

      await expect(page).toHaveURL(/localhost:5173\/?$/);
    });

    test('invalid OUT – prevents submission and shows stock limit error', async ({ page }) => {
      await mockProductsApi(page, 5);
      // No movements mock — the POST must never fire.

      await page.goto('/movements');
      await selectFromDropdown(page, 'type', 'Salida');
      await selectFromDropdown(page, 'productId', PRODUCT_NAME);
      await page.locator('#quantity').fill('10'); // 10 > 5, exceeds stock
      await page.getByRole('button', { name: 'Guardar movimiento' }).click();

      await expect(
        page.getByText('Solo puedes sacar hasta 5 unidades'),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/movements/);
    });
  });
});
