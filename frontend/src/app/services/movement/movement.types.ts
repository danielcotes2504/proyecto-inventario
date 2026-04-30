export type MovementListQuery = {
  page?: number;
  pageSize?: number;
  productId?: string;
  type?: 'IN' | 'OUT';
  dateFrom?: string;
  dateTo?: string;
};

export type CreateMovementBody = {
  type: string;
  quantity: number;
  productId: string;
  reason: string;
  date: string;
};

export const movementKeys = {
  all: ['movements'] as const,
  list: (query?: MovementListQuery) =>
    [...movementKeys.all, 'list', query ?? {}] as const,
};
