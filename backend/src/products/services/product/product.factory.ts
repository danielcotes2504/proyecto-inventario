import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';

import { MOVEMENT_TYPE } from '../../../database/domain/inventory-domain';
import { Movement } from '../../../database/entities/movement.entity';
import { Product } from '../../../database/entities/product.entity';
import type { CreateProductBody } from '../../schemas/create-product.schema';

export type ProductServiceDeps = {
  productRepository: Repository<Product>;
  dataSource: DataSource;
};

export type ProductWithStockActual = Product & { stock_actual: number };

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
  return {
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
      const balanceSubQuery = deps.dataSource
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

      const { entities, raw } = await deps.productRepository
        .createQueryBuilder('product')
        .leftJoin(
          `(${balanceSubQuery})`,
          'stock_agg',
          'stock_agg.product_id = product.id',
        )
        .addSelect('COALESCE(stock_agg.balance, 0)', 'stock_actual')
        .orderBy('product.name', 'ASC')
        .setParameters({
          inType: MOVEMENT_TYPE.IN,
          outType: MOVEMENT_TYPE.OUT,
        })
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
}

export type ProductServiceFactoryReturn = ReturnType<
  typeof createProductService
>;
