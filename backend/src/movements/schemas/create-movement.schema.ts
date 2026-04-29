import { z } from 'zod';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
  type MovementReason,
  type MovementType,
} from '../../database/domain/inventory-domain';

const typeLiterals = [
  MOVEMENT_TYPE.IN,
  MOVEMENT_TYPE.OUT,
] as const satisfies readonly MovementType[];

const reasonLiterals = [
  MOVEMENT_REASON.COMPRA,
  MOVEMENT_REASON.VENTA,
  MOVEMENT_REASON.AJUSTE,
  MOVEMENT_REASON.MERMA,
  MOVEMENT_REASON.DEVOLUCION,
] as const satisfies readonly MovementReason[];

function normalizeUpper(val: unknown): unknown {
  return typeof val === 'string' ? val.trim().toUpperCase() : val;
}

export const createMovementBodySchema = z.object({
  type: z.preprocess(
    normalizeUpper,
    z.enum(typeLiterals, {
      message: `Must be one of: ${typeLiterals.join(', ')}`,
    }),
  ),
  quantity: z.coerce.number().int().positive(),
  productId: z.string().uuid(),
  reason: z.preprocess(
    normalizeUpper,
    z.enum(reasonLiterals, {
      message: `Must be one of: ${reasonLiterals.join(', ')}`,
    }),
  ),
  date: z.coerce.date(),
});

export type CreateMovementBody = z.infer<typeof createMovementBodySchema>;
