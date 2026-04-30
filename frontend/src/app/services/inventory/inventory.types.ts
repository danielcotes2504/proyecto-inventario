export const inventoryKeys = {
  all: ['inventory'] as const,
  positions: () => [...inventoryKeys.all, 'positions'] as const,
  lowStockAlerts: () =>
    [...inventoryKeys.all, 'alerts', 'low-stock'] as const,
  detail: (productId: string) =>
    [...inventoryKeys.all, 'detail', productId] as const,
};
