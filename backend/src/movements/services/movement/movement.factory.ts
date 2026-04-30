import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';

import { MOVEMENT_TYPE } from '../../../database/domain/inventory-domain';
import { Movement } from '../../../database/entities/movement.entity';
import { Product } from '../../../database/entities/product.entity';
import type { CreateMovementBody } from '../../schemas/create-movement.schema';
import type { ListMovementsQuery } from '../../schemas/list-movements-query.schema';

export type MovementServiceDeps = {
  dataSource: DataSource;
  movementRepository: Repository<Movement>;
};

export type PaginatedMovements = {
  items: Movement[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type MovementDetail = {
  id: string;
  type: Movement['type'];
  quantity: number;
  reason: Movement['reason'];
  date: Date;
  productId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    unit: Product['unit'];
    category: string;
  };
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
    /**
     * T-011 — Single movement by id; 404 when missing. Loads minimal product snapshot.
     */
    async getMovementById(id: string): Promise<MovementDetail> {
      const movement = await deps.movementRepository.findOne({
        where: { id },
        relations: ['product'],
      });

      if (!movement) {
        throw new NotFoundException(`Movement with id "${id}" not found`);
      }

      const { product } = movement;

      return {
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        date: movement.date,
        productId: movement.productId,
        createdAt: movement.createdAt,
        product: {
          id: product.id,
          name: product.name,
          unit: product.unit,
          category: product.category,
        },
      };
    },

    /**
     * T-010 — Paginated list; default order `createdAt` DESC, then `id` DESC.
     * Filters applied in SQL (no full-table load in memory).
     */
    async listMovements(
      query: ListMovementsQuery,
    ): Promise<PaginatedMovements> {
      const { page, pageSize, productId, type, dateFrom, dateTo } = query;

      const qb = deps.movementRepository
        .createQueryBuilder('movement')
        .orderBy('movement.createdAt', 'DESC')
        .addOrderBy('movement.id', 'DESC');

      if (productId) {
        qb.andWhere('movement.productId = :productId', { productId });
      }
      if (type) {
        qb.andWhere('movement.type = :type', { type });
      }
      if (dateFrom) {
        qb.andWhere('movement.date >= :dateFrom', { dateFrom });
      }
      if (dateTo) {
        qb.andWhere('movement.date <= :dateTo', { dateTo });
      }

      const skip = (page - 1) * pageSize;
      qb.skip(skip).take(pageSize);

      const [items, total] = await qb.getManyAndCount();
      const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

      return {
        items,
        meta: { total, page, pageSize, totalPages },
      };
    },

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
