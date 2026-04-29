import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Product } from '../database/entities/product.entity';
import { createProductBodySchema } from './schemas/create-product.schema';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockRepo = {
    create: jest.fn((data: Partial<Product>) => data),
    save: jest.fn(async (entity: Product) => ({
      ...entity,
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('persists a valid payload via factory-backed service', async () => {
    const dto = {
      name: 'Test product',
      description: 'Desc',
      unit: 'KG' as const,
      category: 'Cat',
      stock_minimo: 5,
      status: 'ACTIVO' as const,
    };

    const product = await service.create(dto);

    expect(mockRepo.create).toHaveBeenCalledWith({
      name: dto.name,
      description: dto.description,
      unit: dto.unit,
      category: dto.category,
      stock_minimo: dto.stock_minimo,
      status: dto.status,
    });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(product.id).toBeDefined();
    expect(product.name).toBe(dto.name);
  });
});

describe('createProductBodySchema', () => {
  it('rejects invalid unit', () => {
    const result = createProductBodySchema.safeParse({
      name: 'A',
      description: 'B',
      unit: 'INVALID_UNIT',
      category: 'C',
      stock_minimo: 1,
      status: 'ACTIVO',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes lowercase unit and status', () => {
    const result = createProductBodySchema.safeParse({
      name: 'A',
      description: 'B',
      unit: 'kg',
      category: 'C',
      stock_minimo: 1,
      status: 'activo',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe('KG');
      expect(result.data.status).toBe('ACTIVO');
    }
  });
});
