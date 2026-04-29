import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { Product } from '../database/entities/product.entity';
import { createProductBodySchema } from './schemas/create-product.schema';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockBalanceSubQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getQuery: jest.fn(() => '(aggregated_movements_subquery)'),
  };

  const mockProductListQb = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
  };

  const mockManager = {
    findOne: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn((data: Partial<Product>) => data),
    save: jest.fn((entity: Product) =>
      Promise.resolve({
        ...entity,
        id: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }),
    ),
    createQueryBuilder: jest.fn(() => mockProductListQb),
  };

  const mockDataSource = {
    transaction: jest.fn(
      async (cb: (manager: typeof mockManager) => Promise<void>) => {
        await cb(mockManager);
      },
    ),
    createQueryBuilder: jest.fn(() => ({
      subQuery: jest.fn(() => mockBalanceSubQueryBuilder),
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
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
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

  describe('findAll (T-004)', () => {
    it('maps stock_actual from aggregated raw column', async () => {
      const productEntity = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'P',
        description: 'd',
        unit: 'KG',
        category: 'c',
        stock_minimo: 1,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [productEntity],
        raw: [{ stock_actual: '23' }],
      });

      const rows = await service.findAll();

      expect(mockDataSource.createQueryBuilder).toHaveBeenCalled();
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(rows).toHaveLength(1);
      expect(rows[0].stock_actual).toBe(23);
      expect(rows[0].name).toBe('P');
    });

    it('defaults stock_actual to 0 when raw omits the column', async () => {
      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Q',
            description: '',
            unit: 'KG',
            category: '',
            stock_minimo: 0,
            status: 'ACTIVO',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Product,
        ],
        raw: [{}],
      });

      const rows = await service.findAll();
      expect(rows[0].stock_actual).toBe(0);
    });
  });

  describe('delete (T-002)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('deletes when product exists and has no movements', async () => {
      mockManager.findOne.mockResolvedValue({
        id,
        name: 'P',
      });
      mockManager.count.mockResolvedValue(0);
      mockManager.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.delete(id);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.count).toHaveBeenCalled();
      expect(mockManager.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
      expect(mockManager.count).not.toHaveBeenCalled();
      expect(mockManager.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException when movements exist', async () => {
      mockManager.findOne.mockResolvedValue({ id });
      mockManager.count.mockResolvedValue(2);

      try {
        await service.delete(id);
        fail('expected ConflictException');
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictException);
        expect((err as ConflictException).message).toBe(
          'Cannot delete product: associated movements found.',
        );
      }
      expect(mockManager.delete).not.toHaveBeenCalled();
    });
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
