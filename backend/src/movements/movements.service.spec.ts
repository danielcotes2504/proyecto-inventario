import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
} from '../database/domain/inventory-domain';
import { Movement } from '../database/entities/movement.entity';
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

  it('throws BadRequestException when OUT exceeds stock', async () => {
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
      fail('expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual(
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
