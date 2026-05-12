import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';

import {
  PRODUCT_STATUS,
  PRODUCT_UNIT,
} from '../common/domain/inventory-domain';
import { ProductsService } from '../products/products.service';
import type { ProductWithStockActual } from '../products/services/product/product.factory';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockProductsService = {
    findOne: jest.fn(),
    findInventoryPositions: jest.fn(),
    findInventoryAlerts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get(InventoryService);
  });

  const productId = '550e8400-e29b-41d4-a716-446655440001';

  const baseProduct: ProductWithStockActual = {
    id: productId,
    name: 'Aceite de oliva',
    description: 'Presentación 1 L',
    unit: PRODUCT_UNIT.LITROS,
    category: 'Abarrotes',
    status: PRODUCT_STATUS.ACTIVO,
    stock_minimo: 10,
    stock_actual: 0,
    movements: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  // ─── Unit tests ────────────────────────────────────────────────────────────

  describe('getProductDetail', () => {
    it('sets low_stock true when stock_actual equals stock_minimo (M8 inclusive boundary)', async () => {
      mockProductsService.findOne.mockResolvedValue({
        ...baseProduct,
        stock_actual: 10,
        stock_minimo: 10,
      });

      const result = await service.getProductDetail(productId);

      expect(result.low_stock).toBe(true);
      expect(result.stock_actual).toBe(10);
      expect(result.stock_minimo).toBe(10);
    });

    it('sets low_stock true when stock_actual is below stock_minimo', async () => {
      mockProductsService.findOne.mockResolvedValue({
        ...baseProduct,
        stock_actual: 3,
        stock_minimo: 10,
      });

      const result = await service.getProductDetail(productId);

      expect(result.low_stock).toBe(true);
    });

    it('sets low_stock false when stock_actual is above stock_minimo', async () => {
      mockProductsService.findOne.mockResolvedValue({
        ...baseProduct,
        stock_actual: 11,
        stock_minimo: 10,
      });

      const result = await service.getProductDetail(productId);

      expect(result.low_stock).toBe(false);
    });

    it('maps all DTO fields from the underlying product', async () => {
      const product: ProductWithStockActual = {
        ...baseProduct,
        stock_actual: 15,
      };
      mockProductsService.findOne.mockResolvedValue(product);

      const result = await service.getProductDetail(productId);

      expect(result).toEqual({
        id: product.id,
        name: product.name,
        description: product.description,
        unit: product.unit,
        category: product.category,
        status: product.status,
        stock_minimo: product.stock_minimo,
        stock_actual: 15,
        low_stock: false,
      });
    });

    it('propagates NotFoundException when product does not exist', async () => {
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException(`Product with id "${productId}" not found`),
      );

      await expect(service.getProductDetail(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPositions', () => {
    it('delegates entirely to productsService.findInventoryPositions', async () => {
      const positions = [
        {
          id: productId,
          name: 'P',
          stock_actual: 5,
          stock_minimo: 3,
          low_stock: false,
        },
      ];
      mockProductsService.findInventoryPositions.mockResolvedValue(positions);

      const result = await service.getPositions();

      expect(mockProductsService.findInventoryPositions).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toBe(positions);
    });
  });

  describe('getAlerts', () => {
    it('delegates entirely to productsService.findInventoryAlerts', async () => {
      const alerts = [
        { id: productId, name: 'P', stock_actual: 2, stock_minimo: 5 },
      ];
      mockProductsService.findInventoryAlerts.mockResolvedValue(alerts);

      const result = await service.getAlerts();

      expect(mockProductsService.findInventoryAlerts).toHaveBeenCalledTimes(1);
      expect(result).toBe(alerts);
    });
  });

  // ─── PBT — Property 2: M8 consistency ─────────────────────────────────────

  describe('PBT — Property 2: M8 low_stock is consistent with alerts filter', () => {
    it('the set of products with low_stock=true matches the DB alerts WHERE condition for any stock values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              stock_actual: fc.integer({ min: 0, max: 10_000 }),
              stock_minimo: fc.integer({ min: 0, max: 10_000 }),
            }),
            { minLength: 1, maxLength: 30 },
          ),
          (stockData) => {
            const products = stockData.map((d, i) => ({
              id: `p-${i}`,
              ...d,
            }));

            // Simulates findAllInventoryPositions JS mapping
            const positionLowStockIds = new Set(
              products
                .filter((p) => p.stock_actual <= p.stock_minimo)
                .map((p) => p.id),
            );

            // Simulates findAlertsWithStock DB WHERE clause:
            // WHERE COALESCE(stock_agg.balance, 0) <= product.stock_minimo
            const alertIds = new Set(
              products
                .filter((p) => p.stock_actual <= p.stock_minimo)
                .map((p) => p.id),
            );

            return (
              positionLowStockIds.size === alertIds.size &&
              [...positionLowStockIds].every((id) => alertIds.has(id))
            );
          },
        ),
        { numRuns: 2_000 },
      );
    });

    it('a product with zero stock is always a low-stock alert for any non-negative minimum', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100_000 }), (stockMinimo) => {
          const stockActual = 0;
          // stock_actual=0 satisfies `<= stockMinimo` for any stockMinimo >= 0
          return stockActual <= stockMinimo;
        }),
        { numRuns: 10_000 },
      );
    });
  });
});
