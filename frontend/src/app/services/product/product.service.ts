import { getApiBaseUrl } from '#/app/lib/api-config';
import { parseJsonOrThrow } from '#/app/lib/http';

export const productService = {
  fetchList(signal?: AbortSignal): Promise<unknown> {
    const url = `${getApiBaseUrl()}/products`;
    return fetch(url, { signal }).then(parseJsonOrThrow);
  },
};
