import type { DataSource } from 'typeorm';

import { MOVEMENT_TYPE } from '../domain/inventory-domain';
import { Movement } from '../entities/movement.entity';

/** Bound parameters required alongside SQL returned by {@link buildMovementStockBalanceSubQuerySql}. */
export const STOCK_MOVEMENT_QUERY_PARAMS = {
  inType: MOVEMENT_TYPE.IN,
  outType: MOVEMENT_TYPE.OUT,
} as const;

/**
 * Aggregates movement quantities per product — **SUM(IN qty) − SUM(OUT qty)**.
 * Shared by product listing (T-004) and inventory alerts (T-005).
 */
export function buildMovementStockBalanceSubQuerySql(
  dataSource: DataSource,
): string {
  return dataSource
    .createQueryBuilder()
    .subQuery()
    .select('m.product_id', 'product_id')
    .addSelect(
      `COALESCE(SUM(CASE WHEN m.type = :inType THEN m.quantity ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN m.type = :outType THEN m.quantity ELSE 0 END), 0)`,
      'balance',
    )
    .from(Movement, 'm')
    .groupBy('m.product_id')
    .getQuery();
}
