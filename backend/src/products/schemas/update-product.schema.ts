import { z } from 'zod';

import { createProductBodySchema } from './create-product.schema';

/**
 * T-009 — Partial update: same domain rules as creation for fields that appear in the body.
 * Empty object rejected (at least one field required).
 */
export const updateProductBodySchema = createProductBodySchema
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided for PATCH',
      });
    }
  });

export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
