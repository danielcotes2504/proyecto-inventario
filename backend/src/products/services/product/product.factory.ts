import type { Repository } from 'typeorm';

import type { Product } from '../../../database/entities/product.entity';
import type { CreateProductBody } from '../../schemas/create-product.schema';

export type ProductServiceDeps = {
  productRepository: Repository<Product>;
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
  };
}

export type ProductServiceFactoryReturn = ReturnType<typeof createProductService>;
