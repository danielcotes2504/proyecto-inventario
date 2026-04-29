/**
 * Shape returned by `GET /inventory/alerts` (T-005).
 * Lives outside Nest DI to avoid module coupling with products internals.
 */
export type InventoryAlertItem = {
  id: string;
  name: string;
  stock_actual: number;
  stock_minimo: number;
};
