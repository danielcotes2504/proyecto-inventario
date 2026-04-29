import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';

import { MOVEMENT_TYPE } from '../../../database/domain/inventory-domain';
import { Movement } from '../../../database/entities/movement.entity';
import { Product } from '../../../database/entities/product.entity';
import type { CreateMovementBody } from '../../schemas/create-movement.schema';

export type MovementServiceDeps = {
  dataSource: DataSource;
};

async function getCurrentStock(
  manager: EntityManager,
  productId: string,
): Promise<number> {
  const row = await manager
    .createQueryBuilder()
    .select(
      `COALESCE(SUM(CASE WHEN m.type = :inType THEN m.quantity ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN m.type = :outType THEN m.quantity ELSE 0 END), 0)`,
      'stock',
    )
    .from(Movement, 'm')
    .where('m.product_id = :productId', { productId })
    .setParameters({
      inType: MOVEMENT_TYPE.IN,
      outType: MOVEMENT_TYPE.OUT,
    })
    .getRawOne<{ stock: string | number | null }>();

  const raw = row?.stock ?? 0;
  const n = typeof raw === 'string' ? Number(raw) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function createMovementService(deps: MovementServiceDeps) {
  return {
    async registerMovement(payload: CreateMovementBody): Promise<Movement> {
      return deps.dataSource.transaction(async (manager) => {
        const product = await manager.findOne(Product, {
          where: { id: payload.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id "${payload.productId}" not found`,
          );
        }

        if (payload.type === MOVEMENT_TYPE.OUT) {
          const currentStock = await getCurrentStock(
            manager,
            payload.productId,
          );
          if (payload.quantity > currentStock) {
            throw new BadRequestException(
              'Insufficient stock for this operation.',
            );
          }
        }

        const movement = manager.create(Movement, {
          type: payload.type,
          quantity: payload.quantity,
          reason: payload.reason,
          date: payload.date,
          productId: payload.productId,
        });

        return manager.save(movement);
      });
    },
  };
}

export type MovementServiceFactoryReturn = ReturnType<
  typeof createMovementService
>;
