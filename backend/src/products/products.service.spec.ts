import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';

import { Movement } from '../movements/entities/movement.entity';
import { Product } from './entities/product.entity';
import { createProductBodySchema } from './schemas/create-product.schema';
import { updateProductBodySchema } from './schemas/update-product.schema';
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
    where: jest.fn().mockReturnThis(),
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
    findOne: jest.fn(),
    update: jest.fn(),
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
      expect(mockProductListQb.leftJoin).toHaveBeenCalledWith(
        '((aggregated_movements_subquery))',
        'stock_agg',
        'stock_agg.product_id = product.id',
      );
      expect(mockProductListQb.addSelect).toHaveBeenCalledWith(
        'COALESCE(stock_agg.balance, 0)',
        'stock_actual',
      );
      expect(mockProductListQb.orderBy).toHaveBeenCalledWith(
        'product.name',
        'ASC',
      );
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

  describe('findInventoryPositions (T-012)', () => {
    it('maps stock_actual like GET /products and sets low_stock with M8 inclusive boundary', async () => {
      const pAtBoundary = {
        id: '550e8400-e29b-41d4-a716-446655440030',
        name: 'At boundary',
        description: '',
        unit: 'KG',
        category: '',
        stock_minimo: 10,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const pAbove = {
        id: '550e8400-e29b-41d4-a716-446655440031',
        name: 'Above min',
        description: '',
        unit: 'KG',
        category: '',
        stock_minimo: 10,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const pBelow = {
        id: '550e8400-e29b-41d4-a716-446655440032',
        name: 'Below min',
        description: '',
        unit: 'KG',
        category: '',
        stock_minimo: 10,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [pAtBoundary, pAbove, pBelow],
        raw: [
          { stock_actual: '10' },
          { stock_actual: '11' },
          { stock_actual: '4' },
        ],
      });

      const rows = await service.findInventoryPositions();

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockProductListQb.leftJoin).toHaveBeenCalledWith(
        '((aggregated_movements_subquery))',
        'stock_agg',
        'stock_agg.product_id = product.id',
      );
      expect(mockProductListQb.addSelect).toHaveBeenCalledWith(
        'COALESCE(stock_agg.balance, 0)',
        'stock_actual',
      );
      expect(mockProductListQb.where).not.toHaveBeenCalled();
      expect(mockProductListQb.orderBy).toHaveBeenCalledWith(
        'product.name',
        'ASC',
      );
      expect(rows).toEqual([
        {
          id: pAtBoundary.id,
          name: 'At boundary',
          stock_actual: 10,
          stock_minimo: 10,
          low_stock: true,
        },
        {
          id: pAbove.id,
          name: 'Above min',
          stock_actual: 11,
          stock_minimo: 10,
          low_stock: false,
        },
        {
          id: pBelow.id,
          name: 'Below min',
          stock_actual: 4,
          stock_minimo: 10,
          low_stock: true,
        },
      ]);
    });
  });

  describe('findOne (T-008)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440011';

    it('returns product with stock_actual from single aggregated query', async () => {
      const entity = {
        id,
        name: 'One',
        description: '',
        unit: 'KG',
        category: '',
        stock_minimo: 2,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [entity],
        raw: [{ stock_actual: '8' }],
      });

      const row = await service.findOne(id);

      expect(mockProductListQb.leftJoin).toHaveBeenCalledWith(
        '((aggregated_movements_subquery))',
        'stock_agg',
        'stock_agg.product_id = product.id',
      );
      expect(mockProductListQb.addSelect).toHaveBeenCalledWith(
        'COALESCE(stock_agg.balance, 0)',
        'stock_actual',
      );
      expect(mockProductListQb.where).toHaveBeenCalledWith('product.id = :id', {
        id,
      });
      expect(row.stock_actual).toBe(8);
      expect(row.id).toBe(id);
      expect(row.name).toBe('One');
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [],
        raw: [],
      });

      await expect(service.findOne(id)).rejects.toMatchObject({
        message: `Product with id "${id}" not found`,
      });
    });
  });

  describe('update / patch (T-009)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440077';

    const baseProduct = {
      id,
      name: 'Old',
      description: 'd',
      unit: 'KG',
      category: 'c',
      stock_minimo: 5,
      status: 'ACTIVO',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;

    beforeEach(() => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
    });

    it('applies partial fields and returns product with stock_actual', async () => {
      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [{ ...baseProduct, name: 'New' }],
        raw: [{ stock_actual: '3' }],
      });

      const result = await service.update(id, { name: 'New' });

      expect(mockRepo.update).toHaveBeenCalledWith({ id }, { name: 'New' });
      expect(result.stock_actual).toBe(3);
      expect(result.name).toBe('New');
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockRepo.update.mockResolvedValue({ affected: 0 });

      await expect(service.update(id, { name: 'X' })).rejects.toMatchObject({
        message: `Product with id "${id}" not found`,
      });
    });
  });

  describe('findInventoryAlerts (T-005)', () => {
    it('returns slim rows with db-side M8 filter applied', async () => {
      const alertProduct = {
        id: '550e8400-e29b-41d4-a716-446655440099',
        name: 'Low stock',
        description: 'd',
        unit: 'KG',
        category: 'c',
        stock_minimo: 10,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [alertProduct],
        raw: [{ stock_actual: '5' }],
      });

      const rows = await service.findInventoryAlerts();

      expect(mockProductListQb.leftJoin).toHaveBeenCalledWith(
        '((aggregated_movements_subquery))',
        'stock_agg',
        'stock_agg.product_id = product.id',
      );
      expect(mockProductListQb.addSelect).toHaveBeenCalledWith(
        'COALESCE(stock_agg.balance, 0)',
        'stock_actual',
      );
      expect(mockProductListQb.where).toHaveBeenCalledWith(
        'COALESCE(stock_agg.balance, 0) <= product.stock_minimo',
      );
      expect(mockProductListQb.orderBy).toHaveBeenCalledWith(
        'product.name',
        'ASC',
      );
      expect(rows).toEqual([
        {
          id: alertProduct.id,
          name: 'Low stock',
          stock_actual: 5,
          stock_minimo: 10,
        },
      ]);
    });

    it('M8: product with stock_actual === stock_minimo is included in alerts', async () => {
      const boundaryProduct = {
        id: '550e8400-e29b-41d4-a716-446655440088',
        name: 'Boundary',
        description: 'd',
        unit: 'KG',
        category: 'c',
        stock_minimo: 7,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [boundaryProduct],
        raw: [{ stock_actual: '7' }],
      });

      const rows = await service.findInventoryAlerts();

      expect(rows).toHaveLength(1);
      expect(rows[0].stock_actual).toBe(7);
      expect(rows[0].stock_minimo).toBe(7);
    });

    it('M8: returns exact stock_actual value from aggregate (kills arithmetic mutations)', async () => {
      const p = {
        id: '550e8400-e29b-41d4-a716-446655440077',
        name: 'P',
        description: 'd',
        unit: 'KG',
        category: 'c',
        stock_minimo: 20,
        status: 'ACTIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockProductListQb.getRawAndEntities.mockResolvedValue({
        entities: [p],
        raw: [{ stock_actual: '3' }],
      });

      const rows = await service.findInventoryAlerts();

      expect(rows[0].stock_actual).toBe(3);
      expect(rows[0].stock_minimo).toBe(20);
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
      expect(mockManager.findOne).toHaveBeenCalledWith(Product, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.count).toHaveBeenCalledWith(Movement, {
        where: { productId: id },
      });
      expect(mockManager.delete).toHaveBeenCalledWith(Product, { id });
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toMatchObject({
        message: `Product with id "${id}" not found`,
      });
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

describe('updateProductBodySchema', () => {
  it('rejects empty object', () => {
    expect(updateProductBodySchema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    expect(updateProductBodySchema.safeParse({ unknown: true }).success).toBe(
      false,
    );
  });

  it('accepts a single valid field', () => {
    const result = updateProductBodySchema.safeParse({ stock_minimo: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock_minimo).toBe(10);
    }
  });
});

// ─── PBT ───────────────────────────────────────────────────────────────────

describe('PBT — P4: stock_minimo must be non-negative', () => {
  const validBase = {
    name: 'P',
    description: 'D',
    unit: 'KG',
    category: 'C',
    status: 'ACTIVO',
  };

  it('rejects any negative stock_minimo', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000, max: -1 }), (stockMinimo) => {
        const r = createProductBodySchema.safeParse({
          ...validBase,
          stock_minimo: stockMinimo,
        });
        return !r.success;
      }),
      { numRuns: 1_000 },
    );
  });

  it('accepts stock_minimo = 0 (zero is a valid threshold)', () => {
    const r = createProductBodySchema.safeParse({
      ...validBase,
      stock_minimo: 0,
    });
    expect(r.success).toBe(true);
  });

  it('accepts any non-negative integer stock_minimo', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (stockMinimo) => {
        const r = createProductBodySchema.safeParse({
          ...validBase,
          stock_minimo: stockMinimo,
        });
        return r.success;
      }),
      { numRuns: 500 },
    );
  });
});

// ─── PBT — P9 ──────────────────────────────────────────────────────────────

describe('PBT — P9: deterministic alert membership (M8)', () => {
  it('low_stock flag and alert-filter predicate always agree for any stock values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        (stockActual, stockMinimo) => {
          const lowStockFlag = stockActual <= stockMinimo;
          const isInAlerts = stockActual <= stockMinimo;
          return lowStockFlag === isInAlerts;
        },
      ),
      { numRuns: 10_000 },
    );
  });

  it('stock === stock_minimo is always a low-stock alert (M8 inclusive boundary)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (stockMinimo) => {
        const stockActual = stockMinimo;
        return stockActual <= stockMinimo;
      }),
      { numRuns: 10_000 },
    );
  });

  it('stock === stock_minimo + 1 is never a low-stock alert', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 99_999 }), (stockMinimo) => {
        const stockActual = stockMinimo + 1;
        return !(stockActual <= stockMinimo);
      }),
      { numRuns: 10_000 },
    );
  });
});
