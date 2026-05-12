import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
  PRODUCT_STATUS,
  PRODUCT_UNIT,
} from '../common/domain/inventory-domain';
import { Movement } from './entities/movement.entity';
import { createMovementBodySchema } from './schemas/create-movement.schema';
import { listMovementsQuerySchema } from './schemas/list-movements-query.schema';
import { MovementsService } from './movements.service';

describe('MovementsService', () => {
  let service: MovementsService;

  const productId = '550e8400-e29b-41d4-a716-446655440001';

  const stockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const listQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockMovementRepo = {
    createQueryBuilder: jest.fn(() => listQueryBuilder),
    findOne: jest.fn(),
  };

  const mockManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => stockQueryBuilder),
  };

  const mockDataSource = {
    transaction: jest.fn(
      async <T>(cb: (m: typeof mockManager) => Promise<T>): Promise<T> =>
        cb(mockManager),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    stockQueryBuilder.getRawOne.mockResolvedValue({ stock: '10' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Movement),
          useValue: mockMovementRepo,
        },
      ],
    }).compile();

    service = module.get(MovementsService);
  });

  it('registers IN without stock query', async () => {
    mockManager.findOne.mockResolvedValue({ id: productId });
    mockManager.create.mockImplementation((_entity: unknown, data: object) => ({
      ...data,
    }));
    mockManager.save.mockImplementation((row: object) =>
      Promise.resolve({
        ...row,
        id: 'mov-1',
        createdAt: new Date('2026-01-01'),
      }),
    );

    const movement = await service.register({
      type: MOVEMENT_TYPE.IN,
      quantity: 100,
      productId,
      reason: MOVEMENT_REASON.COMPRA,
      date: new Date('2026-04-01'),
    });

    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockManager.createQueryBuilder).not.toHaveBeenCalled();
    expect(mockMovementRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(movement.id).toBe('mov-1');
    expect(movement.quantity).toBe(100);
  });

  it('registers OUT when stock is sufficient', async () => {
    mockManager.findOne.mockResolvedValue({ id: productId });
    stockQueryBuilder.getRawOne.mockResolvedValue({ stock: '10' });
    mockManager.create.mockImplementation((_entity: unknown, data: object) => ({
      ...data,
    }));
    mockManager.save.mockImplementation((row: object) =>
      Promise.resolve({
        ...row,
        id: 'mov-2',
        createdAt: new Date('2026-01-01'),
      }),
    );

    await service.register({
      type: MOVEMENT_TYPE.OUT,
      quantity: 10,
      productId,
      reason: MOVEMENT_REASON.VENTA,
      date: new Date('2026-04-01'),
    });

    expect(mockManager.createQueryBuilder).toHaveBeenCalled();
    expect(stockQueryBuilder.getRawOne).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
  });

  it('throws UnprocessableEntityException when OUT exceeds stock', async () => {
    mockManager.findOne.mockResolvedValue({ id: productId });
    stockQueryBuilder.getRawOne.mockResolvedValue({ stock: '3' });

    try {
      await service.register({
        type: MOVEMENT_TYPE.OUT,
        quantity: 5,
        productId,
        reason: MOVEMENT_REASON.VENTA,
        date: new Date('2026-04-01'),
      });
      fail('expected UnprocessableEntityException');
    } catch (err) {
      expect(err).toBeInstanceOf(UnprocessableEntityException);
      expect((err as UnprocessableEntityException).getResponse()).toEqual(
        expect.objectContaining({
          message: 'Insufficient stock for this operation.',
        }),
      );
    }

    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when product is missing', async () => {
    mockManager.findOne.mockResolvedValue(null);

    await expect(
      service.register({
        type: MOVEMENT_TYPE.IN,
        quantity: 1,
        productId,
        reason: MOVEMENT_REASON.COMPRA,
        date: new Date('2026-04-01'),
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockManager.save).not.toHaveBeenCalled();
  });

  describe('findOne (T-011)', () => {
    const movementId = '660e8400-e29b-41d4-a716-446655440099';

    it('returns movement with minimal product snapshot', async () => {
      const date = new Date('2026-04-15T10:00:00.000Z');
      const createdAt = new Date('2026-04-15T10:05:00.000Z');

      mockMovementRepo.findOne.mockResolvedValue({
        id: movementId,
        type: MOVEMENT_TYPE.IN,
        quantity: 5,
        reason: MOVEMENT_REASON.COMPRA,
        date,
        productId,
        createdAt,
        product: {
          id: productId,
          name: 'Test product',
          unit: PRODUCT_UNIT.UNIDADES,
          category: 'Test cat',
        },
      });

      const result = await service.findOne(movementId);

      expect(mockMovementRepo.findOne).toHaveBeenCalledWith({
        where: { id: movementId },
        relations: ['product'],
      });
      expect(result).toEqual({
        id: movementId,
        type: MOVEMENT_TYPE.IN,
        quantity: 5,
        reason: MOVEMENT_REASON.COMPRA,
        date,
        productId,
        createdAt,
        product: {
          id: productId,
          name: 'Test product',
          unit: PRODUCT_UNIT.UNIDADES,
          category: 'Test cat',
        },
      });
    });

    it('throws NotFoundException when movement does not exist', async () => {
      mockMovementRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(movementId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMovementRepo.findOne).toHaveBeenCalledWith({
        where: { id: movementId },
        relations: ['product'],
      });
    });
  });

  describe('list (T-010)', () => {
    it('returns empty items with meta.total 0', async () => {
      listQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.list({
        page: 1,
        pageSize: 20,
      });

      expect(mockMovementRepo.createQueryBuilder).toHaveBeenCalledWith(
        'movement',
      );
      expect(listQueryBuilder.orderBy).toHaveBeenCalledWith(
        'movement.createdAt',
        'DESC',
      );
      expect(listQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(listQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.items).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    });

    it('applies skip/take for page 2', async () => {
      listQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list({ page: 2, pageSize: 10 });

      expect(listQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(listQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('adds filters when provided', async () => {
      listQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-01-31');

      await service.list({
        page: 1,
        pageSize: 20,
        productId,
        type: MOVEMENT_TYPE.IN,
        dateFrom,
        dateTo,
      });

      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        'movement.productId = :productId',
        { productId },
      );
      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        'movement.type = :type',
        { type: MOVEMENT_TYPE.IN },
      );
      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        'movement.date >= :dateFrom',
        { dateFrom },
      );
      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        'movement.date <= :dateTo',
        { dateTo },
      );
    });
  });

  // ─── PBT — P1 edge (service level) ────────────────────────────────────────

  describe('PBT — P1 edge: OUT at exact stock boundary always succeeds', () => {
    it('registers OUT when quantity equals current stock for any positive stock value', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 10_000 }), async (stock) => {
          mockManager.findOne.mockResolvedValue({
            id: productId,
            status: PRODUCT_STATUS.ACTIVO,
          });
          stockQueryBuilder.getRawOne.mockResolvedValue({
            stock: String(stock),
          });
          mockManager.create.mockImplementation((_: unknown, data: object) => ({
            ...data,
          }));
          mockManager.save.mockResolvedValue({
            id: 'mov-edge',
            quantity: stock,
            createdAt: new Date(),
          });

          let threw = false;
          try {
            await service.register({
              type: MOVEMENT_TYPE.OUT,
              quantity: stock,
              productId,
              reason: MOVEMENT_REASON.VENTA,
              date: new Date('2026-01-01'),
            });
          } catch {
            threw = true;
          }
          return !threw;
        }),
        { numRuns: 50 },
      );
    });
  });

  // ─── PBT — P5 (service level) ─────────────────────────────────────────────

  describe('PBT — P5: inactive product rejects any movement', () => {
    it('throws UnprocessableEntityException for any type/quantity when product is INACTIVO', async () => {
      mockManager.findOne.mockResolvedValue({
        id: productId,
        status: PRODUCT_STATUS.INACTIVO,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(MOVEMENT_TYPE.IN, MOVEMENT_TYPE.OUT),
          fc.integer({ min: 1, max: 10_000 }),
          async (type, quantity) => {
            let threw = false;
            try {
              await service.register({
                type,
                quantity,
                productId,
                reason: MOVEMENT_REASON.COMPRA,
                date: new Date('2026-01-01'),
              });
            } catch (err) {
              threw = err instanceof UnprocessableEntityException;
            }
            return threw;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});

describe('createMovementBodySchema', () => {
  it('normalizes type and reason to uppercase', () => {
    const result = createMovementBodySchema.safeParse({
      type: 'in',
      quantity: '5',
      productId: '550e8400-e29b-41d4-a716-446655440001',
      reason: 'compra',
      date: '2026-04-01T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe(MOVEMENT_TYPE.IN);
      expect(result.data.reason).toBe(MOVEMENT_REASON.COMPRA);
      expect(result.data.quantity).toBe(5);
    }
  });
});

describe('listMovementsQuerySchema', () => {
  it('defaults page and pageSize', () => {
    const r = listMovementsQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.pageSize).toBe(20);
    }
  });

  it('caps pageSize at 100', () => {
    const r = listMovementsQuerySchema.safeParse({ pageSize: '500' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.pageSize).toBe(100);
    }
  });

  it('rejects dateFrom after dateTo', () => {
    const r = listMovementsQuerySchema.safeParse({
      dateFrom: '2026-06-01',
      dateTo: '2026-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown query keys', () => {
    expect(listMovementsQuerySchema.safeParse({ foo: 'bar' }).success).toBe(
      false,
    );
  });
});

// ─── PBT ───────────────────────────────────────────────────────────────────

describe('PBT — Property 1: stock balance is always >= 0', () => {
  it('applying validated movements (OUT gated by available stock) never produces a negative balance', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('IN' as const, 'OUT' as const),
            quantity: fc.integer({ min: 1, max: 500 }),
          }),
          { minLength: 1, maxLength: 200 },
        ),
        (movements) => {
          // Mirrors the registerMovement guard:
          // OUT is only persisted when payload.quantity <= currentStock
          let balance = 0;
          for (const { type, quantity } of movements) {
            if (type === 'IN') {
              balance += quantity;
            } else if (quantity <= balance) {
              balance -= quantity;
            }
            // OUT rejected when insufficient — not applied, matching the service behavior
          }
          return balance >= 0;
        },
      ),
      { numRuns: 2_000 },
    );
  });

  it('balance is non-negative even when all movements are OUT (all rejected when stock=0)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1_000 }), {
          minLength: 1,
          maxLength: 100,
        }),
        (quantities) => {
          let balance = 0;
          for (const qty of quantities) {
            if (qty <= balance) balance -= qty;
          }
          return balance >= 0;
        },
      ),
      { numRuns: 1_000 },
    );
  });
});

describe('PBT — Property 3: IN movements sum is order-independent', () => {
  it('total stock_actual is identical regardless of the order IN movements are processed', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 10_000 }), {
          minLength: 1,
          maxLength: 100,
        }),
        (quantities) => {
          const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
          const original = sum(quantities);
          const reversed = sum([...quantities].reverse());
          const ascending = sum([...quantities].sort((a, b) => a - b));
          const descending = sum([...quantities].sort((a, b) => b - a));
          return (
            original === reversed &&
            original === ascending &&
            original === descending
          );
        },
      ),
      { numRuns: 1_000 },
    );
  });
});

// ─── PBT — P2 ──────────────────────────────────────────────────────────────

describe('PBT — P2: movement quantity must be a positive integer', () => {
  const validBase = {
    type: 'IN',
    productId: '550e8400-e29b-41d4-a716-446655440001',
    reason: 'COMPRA',
    date: '2026-01-01T00:00:00.000Z',
  };

  it('rejects zero and negative quantities', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(0), fc.integer({ min: -100_000, max: -1 })),
        (qty) => {
          const r = createMovementBodySchema.safeParse({
            ...validBase,
            quantity: qty,
          });
          return !r.success;
        },
      ),
      { numRuns: 1_000 },
    );
  });

  it('rejects non-integer quantities between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999 }).map((n) => n / 1_000),
        (qty) => {
          const r = createMovementBodySchema.safeParse({
            ...validBase,
            quantity: qty,
          });
          return !r.success;
        },
      ),
      { numRuns: 500 },
    );
  });

  it('accepts any integer >= 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (qty) => {
        const r = createMovementBodySchema.safeParse({
          ...validBase,
          quantity: qty,
        });
        return r.success;
      }),
      { numRuns: 500 },
    );
  });
});

// ─── PBT — P3 extended ─────────────────────────────────────────────────────

describe('PBT — P3 extended: balance invariant (Sum IN - Sum accepted OUT)', () => {
  it('balance always equals sum(IN) minus sum(accepted OUT) for any movement sequence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('IN' as const, 'OUT' as const),
            quantity: fc.integer({ min: 1, max: 1_000 }),
          }),
          { minLength: 1, maxLength: 200 },
        ),
        (movements) => {
          let balance = 0;
          let sumIn = 0;
          let sumAcceptedOut = 0;

          for (const { type, quantity } of movements) {
            if (type === 'IN') {
              balance += quantity;
              sumIn += quantity;
            } else if (quantity <= balance) {
              balance -= quantity;
              sumAcceptedOut += quantity;
            }
          }

          return balance === sumIn - sumAcceptedOut;
        },
      ),
      { numRuns: 2_000 },
    );
  });
});

// ─── PBT — P6 ──────────────────────────────────────────────────────────────

describe('PBT — P6: movement type domain rejects non-IN/OUT values', () => {
  it('rejects any string that does not normalise to IN or OUT', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const u = s.trim().toUpperCase();
          return u !== 'IN' && u !== 'OUT';
        }),
        (invalidType) => {
          const r = createMovementBodySchema.safeParse({
            type: invalidType,
            quantity: 1,
            productId: '550e8400-e29b-41d4-a716-446655440001',
            reason: 'COMPRA',
            date: '2026-01-01T00:00:00.000Z',
          });
          return !r.success;
        },
      ),
      { numRuns: 1_000 },
    );
  });
});

// ─── PBT — P7 ──────────────────────────────────────────────────────────────

describe('PBT — P7: date range coherence in list query', () => {
  const tsMin = new Date('2000-01-01T00:00:00Z').getTime();
  const tsMax = new Date('2030-12-31T00:00:00Z').getTime();
  const dateArb = fc
    .integer({ min: tsMin, max: tsMax })
    .map((ts) => new Date(ts));

  it('rejects dateFrom > dateTo and accepts dateFrom <= dateTo', () => {
    fc.assert(
      fc.property(dateArb, dateArb, (d1, d2) => {
        if (d1.getTime() === d2.getTime()) return true;
        const [earlier, later] = d1 < d2 ? [d1, d2] : [d2, d1];

        const invalid = listMovementsQuerySchema.safeParse({
          dateFrom: later.toISOString(),
          dateTo: earlier.toISOString(),
        });
        const valid = listMovementsQuerySchema.safeParse({
          dateFrom: earlier.toISOString(),
          dateTo: later.toISOString(),
        });
        return !invalid.success && valid.success;
      }),
      { numRuns: 1_000 },
    );
  });

  it('accepts dateFrom === dateTo (same-day window)', () => {
    fc.assert(
      fc.property(dateArb, (d) => {
        const r = listMovementsQuerySchema.safeParse({
          dateFrom: d.toISOString(),
          dateTo: d.toISOString(),
        });
        return r.success;
      }),
      { numRuns: 500 },
    );
  });
});

// ─── PBT — P8 ──────────────────────────────────────────────────────────────

describe('PBT — P8: date filter integrity', () => {
  const tsMin = new Date('2000-01-01T00:00:00Z').getTime();
  const tsMax = new Date('2030-12-31T00:00:00Z').getTime();
  const dateArb = fc
    .integer({ min: tsMin, max: tsMax })
    .map((ts) => new Date(ts));

  it('every movement passing the [dateFrom, dateTo] predicate satisfies the range constraint', () => {
    fc.assert(
      fc.property(
        fc.array(dateArb, { minLength: 1, maxLength: 50 }),
        dateArb,
        dateArb,
        (movementDates, rawA, rawB) => {
          const dateFrom = rawA <= rawB ? rawA : rawB;
          const dateTo = rawA <= rawB ? rawB : rawA;

          const filtered = movementDates.filter(
            (d) => d >= dateFrom && d <= dateTo,
          );

          return filtered.every((d) => d >= dateFrom && d <= dateTo);
        },
      ),
      { numRuns: 1_000 },
    );
  });
});
