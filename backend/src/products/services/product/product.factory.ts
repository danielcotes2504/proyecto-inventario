import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';

import { Movement } from '../../../database/entities/movement.entity';
import { Product } from '../../../database/entities/product.entity';
import type { CreateProductBody } from '../../schemas/create-product.schema';

export type ProductServiceDeps = {
  productRepository: Repository<Product>;
  dataSource: DataSource;
};

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
