/** Domain literals — no TypeScript enums (use unions from `as const` objects). */

export const PRODUCT_UNIT = {
  UNIDADES: 'UNIDADES',
  KG: 'KG',
  LITROS: 'LITROS',
} as const;

export type ProductUnit = (typeof PRODUCT_UNIT)[keyof typeof PRODUCT_UNIT];

export const PRODUCT_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
} as const;

export type MovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE];

export const MOVEMENT_REASON = {
  COMPRA: 'COMPRA',
  VENTA: 'VENTA',
  AJUSTE: 'AJUSTE',
  MERMA: 'MERMA',
  DEVOLUCION: 'DEVOLUCION',
} as const;

export type MovementReason =
  (typeof MOVEMENT_REASON)[keyof typeof MOVEMENT_REASON];
