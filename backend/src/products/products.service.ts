import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Product } from '../database/entities/product.entity';
import type { CreateProductBody } from './schemas/create-product.schema';
import {
  createProductService,
  type ProductServiceFactoryReturn,
} from './services/product/product.factory';

@Injectable()
export class ProductsService {
  private readonly productApi: ProductServiceFactoryReturn;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    this.productApi = createProductService({
      productRepository: this.productRepository,
    });
  }

  create(body: CreateProductBody): Promise<Product> {
    return this.productApi.createProduct(body);
  }
}
