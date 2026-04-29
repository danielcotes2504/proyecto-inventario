import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
} from '../database/domain/inventory-domain';
import { createMovementBodySchema } from './schemas/create-movement.schema';
import { MovementsService } from './movements.service';

describe('MovementsService', () => {
  let service: MovementsService;

  const productId = '550e8400-e29b-41d4-a716-446655440001';

  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  const mockDataSource = {
    transaction: jest.fn(
      async <T>(cb: (m: typeof mockManager) => Promise<T>): Promise<T> =>
        cb(mockManager),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queryBuilder.getRawOne.mockResolvedValue({ stock: '10' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
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
    expect(mockManager.save).toHaveBeenCalled();
    expect(movement.id).toBe('mov-1');
    expect(movement.quantity).toBe(100);
  });

  it('registers OUT when stock is sufficient', async () => {
    mockManager.findOne.mockResolvedValue({ id: productId });
    queryBuilder.getRawOne.mockResolvedValue({ stock: '10' });
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
    expect(queryBuilder.getRawOne).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
  });

  it('throws BadRequestException when OUT exceeds stock', async () => {
    mockManager.findOne.mockResolvedValue({ id: productId });
    queryBuilder.getRawOne.mockResolvedValue({ stock: '3' });

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
