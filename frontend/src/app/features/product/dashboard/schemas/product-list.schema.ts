import { z } from 'zod';

export const PRODUCT_UNIT = {
  UNIDADES: 'UNIDADES',
  KG: 'KG',
  LITROS: 'LITROS',
} as const;

export const PRODUCT_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
} as const;

const unitSchema = z.enum([
  PRODUCT_UNIT.UNIDADES,
  PRODUCT_UNIT.KG,
  PRODUCT_UNIT.LITROS,
]);

const statusSchema = z.enum([
  PRODUCT_STATUS.ACTIVO,
  PRODUCT_STATUS.INACTIVO,
]);

export const productListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  unit: unitSchema,
  category: z.string(),
  stock_minimo: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  stock_actual: z.number(),
});

export const productListSchema = z.array(productListItemSchema);

export type ProductListItem = z.infer<typeof productListItemSchema>;
