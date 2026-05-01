import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';

import {
  buildMovementStockBalanceSubQuerySql,
  STOCK_MOVEMENT_QUERY_PARAMS,
} from '../../../database/queries/movement-stock-balance.subquery';
import { Movement } from '../../../movements/entities/movement.entity';
import { Product } from '../../entities/product.entity';
import type { InventoryAlertItem } from '../../../inventory/types/inventory-alert.item';
import type { CreateProductBody } from '../../schemas/create-product.schema';
import type { UpdateProductBody } from '../../schemas/update-product.schema';

export type ProductServiceDeps = {
  productRepository: Repository<Product>;
  dataSource: DataSource;
};

export type ProductWithStockActual = Product & { stock_actual: number };

/** T-012 — Global inventory row (positions); `stock_actual` matches {@link ProductWithStockActual}. */
export type InventoryPositionItem = {
  id: string;
  name: string;
  stock_actual: number;
  stock_minimo: number;
  low_stock: boolean;
};

function parseAggregateNumber(
  value: string | number | null | undefined,
): number {
  if (value == null) {
    return 0;
  }
  const n = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function createProductService(deps: ProductServiceDeps) {
  const service = {
    async createProduct(payload: CreateProductBody): Promise<Product> {
      const entity = deps.productRepository.create({
        name: payload.name,
        description: payload.description,
        unit: payload.unit,
        category: payload.category,
        stock_minimo: payload.stock_minimo,
        status: payload.status,
      });
      return deps.productRepository.save(entity);
    },

    /**
     * T-004 — List products with `stock_actual` from movement aggregates in one round-trip
     * (LEFT JOIN to grouped subquery; avoids N+1).
     */
    async findAllWithStock(): Promise<ProductWithStockActual[]> {
      const balanceSubQuery = buildMovementStockBalanceSubQuerySql(
        deps.dataSource,
      );

      const { entities, raw } = await deps.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          `(${balanceSubQuery})`,
          'stock_agg',
          'stock_agg.product_id = product.id',
        )
        .addSelect('COALESCE(stock_agg.balance, 0)', 'stock_actual')
        .orderBy('product.name', 'ASC')
        .setParameters(STOCK_MOVEMENT_QUERY_PARAMS)
        .getRawAndEntities();

      return entities.map((product, index) => {
        const row = raw[index] as Record<string, unknown> | undefined;
        const stockRaw = row?.stock_actual;
        return {
          ...product,
          stock_actual: parseAggregateNumber(
            stockRaw as string | number | null | undefined,
          ),
        };
      });
    },

    /**
     * T-012 — All products as inventory positions: same **single** aggregated JOIN as T-004,
     * plus **low_stock** = `(stock_actual <= stock_minimo)` using the parsed numeric balance (M8 inclusive).
     */
    async findAllInventoryPositions(): Promise<InventoryPositionItem[]> {
      const balanceSubQuery = buildMovementStockBalanceSubQuerySql(
        deps.dataSource,
      );

      const { entities, raw } = await deps.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          `(${balanceSubQuery})`,
          'stock_agg',
          'stock_agg.product_id = product.id',
        )
        .addSelect('COALESCE(stock_agg.balance, 0)', 'stock_actual')
        .orderBy('product.name', 'ASC')
        .setParameters(STOCK_MOVEMENT_QUERY_PARAMS)
        .getRawAndEntities();

      return entities.map((product, index) => {
        const row = raw[index] as Record<string, unknown> | undefined;
        const stock_actual = parseAggregateNumber(
          row?.stock_actual as string | number | null | undefined,
        );
        return {
          id: product.id,
          name: product.name,
          stock_actual,
          stock_minimo: product.stock_minimo,
          low_stock: stock_actual <= product.stock_minimo,
        };
      });
    },

    /**
     * T-008 — Single product with `stock_actual` (same aggregation as T-004), one query.
     */
    async findOneWithStock(productId: string): Promise<ProductWithStockActual> {
      const balanceSubQuery = buildMovementStockBalanceSubQuerySql(
        deps.dataSource,
      );

      const { entities, raw } = await deps.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          `(${balanceSubQuery})`,
          'stock_agg',
          'stock_agg.product_id = product.id',
        )
        .addSelect('COALESCE(stock_agg.balance, 0)', 'stock_actual')
        .where('product.id = :id', { id: productId })
        .setParameters(STOCK_MOVEMENT_QUERY_PARAMS)
        .getRawAndEntities();

      const product = entities[0];
      if (!product) {
        throw new NotFoundException(`Product with id "${productId}" not found`);
      }

      const row = raw[0] as Record<string, unknown> | undefined;
      const stockRaw = row?.stock_actual;
      return {
        ...product,
        stock_actual: parseAggregateNumber(
          stockRaw as string | number | null | undefined,
        ),
      };
    },

    /**
     * T-009 — Partial update; response includes `stock_actual` (same as T-008).
     */
    async patchProduct(
      productId: string,
      payload: UpdateProductBody,
    ): Promise<ProductWithStockActual> {
      const product = await deps.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with id "${productId}" not found`);
      }
      Object.assign(product, payload);
      await deps.productRepository.save(product);
      return service.findOneWithStock(productId);
    },

    /**
     * T-005 — M8 inclusive: only products where computed stock_actual ≤ stock_minimo (DB filter).
     */
    async findAlertsWithStock(): Promise<InventoryAlertItem[]> {
      const balanceSubQuery = buildMovementStockBalanceSubQuerySql(
        deps.dataSource,
      );

      const { entities, raw } = await deps.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          `(${balanceSubQuery})`,
          'stock_agg',
          'stock_agg.product_id = product.id',
        )
        .addSelect('COALESCE(stock_agg.balance, 0)', 'stock_actual')
        .where('COALESCE(stock_agg.balance, 0) <= product.stock_minimo')
        .orderBy('product.name', 'ASC')
        .setParameters(STOCK_MOVEMENT_QUERY_PARAMS)
        .getRawAndEntities();

      return entities.map((product, index) => {
        const row = raw[index] as Record<string, unknown> | undefined;
        return {
          id: product.id,
          name: product.name,
          stock_actual: parseAggregateNumber(
            row?.stock_actual as string | number | null | undefined,
          ),
          stock_minimo: product.stock_minimo,
        };
      });
    },

    /**
     * T-002 — Deletes the product only when no movements reference it.
     * Check + delete run inside one DB transaction.
     */
    async deleteProduct(productId: string): Promise<void> {
      await deps.dataSource.transaction(async (manager) => {
        const product = await manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id "${productId}" not found`,
          );
        }

        const movementCount = await manager.count(Movement, {
          where: { productId },
        });

        if (movementCount > 0) {
          throw new ConflictException(
            'Cannot delete product: associated movements found.',
          );
        }

        await manager.delete(Product, { id: productId });
      });
    },
  };
  return service;
}

export type ProductServiceFactoryReturn = ReturnType<
  typeof createProductService
>;
