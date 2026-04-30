import { getApiBaseUrl } from '#/app/lib/api-config';
import { parseJsonOrThrow } from '#/app/lib/http';

import type { MovementListQuery } from './movement.types';

function appendMovementQueryParams(
  sp: URLSearchParams,
  query: MovementListQuery,
): void {
  if (query.page != null) sp.set('page', String(query.page));
  if (query.pageSize != null) sp.set('pageSize', String(query.pageSize));
  if (query.productId != null) sp.set('productId', query.productId);
  if (query.type != null) sp.set('type', query.type);
  if (query.dateFrom != null) sp.set('dateFrom', query.dateFrom);
  if (query.dateTo != null) sp.set('dateTo', query.dateTo);
}

export const movementService = {
  fetchList(
    query?: MovementListQuery,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const sp = new URLSearchParams();
    if (query) {
      appendMovementQueryParams(sp, query);
    }
    const qs = sp.toString();
    const base = getApiBaseUrl();
    const url = qs.length > 0 ? `${base}/movements?${qs}` : `${base}/movements`;
    return fetch(url, { signal }).then(parseJsonOrThrow);
  },
};
