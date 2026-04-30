import { useQuery } from '@tanstack/react-query';

import { productService } from '#/app/services/product/product.service';
import { productKeys } from '#/app/services/product/product.types';

import { mapProductListResponse } from '../mappers/product.mapper';
import { PRODUCT_STATUS } from '../schemas/product-list.schema';

export function useProductDashboard() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: async ({ signal }) => {
      const raw = await productService.fetchList(signal);
      const items = mapProductListResponse(raw);
      return items.filter((p) => p.status === PRODUCT_STATUS.ACTIVO);
    },
  });
}
