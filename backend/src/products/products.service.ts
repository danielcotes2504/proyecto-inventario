import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';

import { Product } from '../database/entities/product.entity';
import type { CreateProductBody } from './schemas/create-product.schema';
import {
  createProductService,
  type ProductServiceFactoryReturn,
  type ProductWithStockActual,
} from './services/product/product.factory';

@Injectable()
export class ProductsService {
  private readonly productApi: ProductServiceFactoryReturn;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.productApi = createProductService({
      productRepository: this.productRepository,
      dataSource: this.dataSource,
    });
  }

  create(body: CreateProductBody): Promise<Product> {
    return this.productApi.createProduct(body);
  }

  findAll(): Promise<ProductWithStockActual[]> {
    return this.productApi.findAllWithStock();
  }

  delete(productId: string): Promise<void> {
    return this.productApi.deleteProduct(productId);
  }
}
