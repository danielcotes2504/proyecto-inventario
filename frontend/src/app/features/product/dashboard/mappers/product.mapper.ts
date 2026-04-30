import { productListSchema } from '../schemas/product-list.schema';

import type { ProductListItem } from '../schemas/product-list.schema';

export function mapProductListResponse(raw: unknown): ProductListItem[] {
  const parsed = productListSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Respuesta inválida de GET /products: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
