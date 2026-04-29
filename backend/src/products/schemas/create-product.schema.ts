import { z } from 'zod';

import {
  PRODUCT_STATUS,
  PRODUCT_UNIT,
  type ProductStatus,
  type ProductUnit,
} from '../../database/domain/inventory-domain';

const unitLiterals = [
  PRODUCT_UNIT.UNIDADES,
  PRODUCT_UNIT.KG,
  PRODUCT_UNIT.LITROS,
] as const satisfies readonly ProductUnit[];

const statusLiterals = [
  PRODUCT_STATUS.ACTIVO,
  PRODUCT_STATUS.INACTIVO,
] as const satisfies readonly ProductStatus[];

/** Normalizes string enums from JSON (e.g. `"kg"` → `"KG"`). */
function normalizeDomainString(val: unknown): unknown {
  return typeof val === 'string' ? val.trim().toUpperCase() : val;
}

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  unit: z.preprocess(
    normalizeDomainString,
    z.enum(unitLiterals, {
      message: `Must be one of: ${unitLiterals.join(', ')}`,
    }),
  ),
  category: z.string().trim().min(1).max(255),
  stock_minimo: z.coerce.number().int().nonnegative(),
  status: z.preprocess(
    normalizeDomainString,
    z.enum(statusLiterals, {
      message: `Must be one of: ${statusLiterals.join(', ')}`,
    }),
  ),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
