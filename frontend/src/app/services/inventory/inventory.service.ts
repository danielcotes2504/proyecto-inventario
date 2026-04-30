import { getApiBaseUrl } from '#/app/lib/api-config';
import { parseJsonOrThrow } from '#/app/lib/http';

export const inventoryService = {
  fetchPositions(signal?: AbortSignal): Promise<unknown> {
    const url = `${getApiBaseUrl()}/inventory`;
    return fetch(url, { signal }).then(parseJsonOrThrow);
  },

  fetchLowStockAlerts(signal?: AbortSignal): Promise<unknown> {
    const url = `${getApiBaseUrl()}/inventory/alerts/low-stock`;
    return fetch(url, { signal }).then(parseJsonOrThrow);
  },

  fetchProductDetail(productId: string, signal?: AbortSignal): Promise<unknown> {
    const url = `${getApiBaseUrl()}/inventory/${encodeURIComponent(productId)}`;
    return fetch(url, { signal }).then(parseJsonOrThrow);
  },
};
