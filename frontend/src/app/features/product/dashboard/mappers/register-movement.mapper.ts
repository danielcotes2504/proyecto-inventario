import type { CreateMovementBody } from '#/app/services/movement/movement.types';

import type { RegisterMovementParsed } from '../schemas/register-movement.schema';

export function mapRegisterMovementToApiBody(
  parsed: RegisterMovementParsed,
): CreateMovementBody {
  return {
    type: parsed.type,
    quantity: parsed.quantity,
    productId: parsed.productId,
    reason: parsed.reason,
    date: new Date(parsed.date).toISOString(),
  };
}
