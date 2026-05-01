import { z } from 'zod';

import {
  MOVEMENT_TYPE,
  type MovementType,
} from '../../common/domain/inventory-domain';

const typeLiterals = [
  MOVEMENT_TYPE.IN,
  MOVEMENT_TYPE.OUT,
] as const satisfies readonly MovementType[];

function normalizeUpper(val: unknown): unknown {
  return typeof val === 'string' ? val.trim().toUpperCase() : val;
}

export function emptyQueryParamToUndefined(val: unknown): unknown {
  if (val === '' || val === undefined || val === null) {
    return undefined;
  }
  return val;
}

function preprocessPositiveInt(defaultVal: number, max?: number) {
  return (val: unknown): number => {
    if (val === '' || val === undefined || val === null) {
      return defaultVal;
    }
    const n = Number(val);
    if (!Number.isFinite(n)) {
      return defaultVal;
    }
    let x = Math.floor(n);
    if (x < 1) {
      return defaultVal;
    }
    if (max !== undefined) {
      x = Math.min(x, max);
    }
    return x;
  };
}

/**
 * T-010 — Query params for `GET /movements`.
 * Convention: **page** (1-based) + **pageSize** (max 100). Order is fixed server-side (`createdAt` DESC).
 */
export const listMovementsQuerySchema = z
  .object({
    page: z.preprocess(preprocessPositiveInt(1), z.number().int().positive()),
    pageSize: z.preprocess(
      preprocessPositiveInt(20, 100),
      z.number().int().positive().max(100),
    ),
    productId: z.preprocess(
      emptyQueryParamToUndefined,
      z.string().uuid().optional(),
    ),
    type: z.preprocess((val) => {
      const v = emptyQueryParamToUndefined(val);
      if (v === undefined) {
        return undefined;
      }
      return normalizeUpper(v);
    }, z.enum(typeLiterals).optional()),
    dateFrom: z.preprocess(
      emptyQueryParamToUndefined,
      z.coerce.date().optional(),
    ),
    dateTo: z.preprocess(
      emptyQueryParamToUndefined,
      z.coerce.date().optional(),
    ),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: 'custom',
        message: 'dateFrom must be before or equal to dateTo',
        path: ['dateTo'],
      });
    }
  });

export type ListMovementsQuery = z.infer<typeof listMovementsQuerySchema>;
