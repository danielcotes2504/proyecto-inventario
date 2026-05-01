import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { getApiBaseUrl } from '#/lib/api-config';
import { HttpError } from '#/lib/http';

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
};

export const PRODUCT_UNIT = {
  UNIDADES: 'UNIDADES',
  KG: 'KG',
  LITROS: 'LITROS',
} as const;

export const PRODUCT_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
} as const;

const unitSchema = z.enum([
  PRODUCT_UNIT.UNIDADES,
  PRODUCT_UNIT.KG,
  PRODUCT_UNIT.LITROS,
]);

const statusSchema = z.enum([
  PRODUCT_STATUS.ACTIVO,
  PRODUCT_STATUS.INACTIVO,
]);

export const productListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  unit: unitSchema,
  category: z.string(),
  stock_minimo: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  stock_actual: z.number(),
});

export const productListSchema = z.array(productListItemSchema);

export type ProductListItem = z.infer<typeof productListItemSchema>;

export const MOVEMENT_TYPE_LITERALS = ['IN', 'OUT'] as const;

export const MOVEMENT_REASON_LITERALS = [
  'COMPRA',
  'VENTA',
  'AJUSTE',
  'MERMA',
  'DEVOLUCION',
] as const;

export type RegisterMovementFormValues = {
  type: (typeof MOVEMENT_TYPE_LITERALS)[number];
  quantity: string;
  productId: string;
  reason: (typeof MOVEMENT_REASON_LITERALS)[number];
  date: string;
};

export function getDefaultRegisterMovementValues(): RegisterMovementFormValues {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    type: 'IN',
    quantity: '',
    productId: '',
    reason: 'COMPRA',
    date: local,
  };
}

export const MOVEMENT_TYPE_LABELS: Record<
  (typeof MOVEMENT_TYPE_LITERALS)[number],
  string
> = {
  IN: 'Entrada',
  OUT: 'Salida',
};

export const MOVEMENT_REASON_LABELS: Record<
  (typeof MOVEMENT_REASON_LITERALS)[number],
  string
> = {
  COMPRA: 'Compra',
  VENTA: 'Venta',
  AJUSTE: 'Ajuste',
  MERMA: 'Merma',
  DEVOLUCION: 'Devolución',
};

export function buildRegisterMovementSchema(
  getStockActual: (productId: string) => number | undefined,
) {
  return z
    .object({
      type: z.enum(MOVEMENT_TYPE_LITERALS),
      quantity: z
        .string()
        .trim()
        .min(1, 'Indica la cantidad.')
        .transform((value) => Number(value))
        .pipe(
          z
            .number()
            .int('La cantidad debe ser un número entero.')
            .positive('La cantidad debe ser mayor que cero.'),
        ),
      productId: z
        .string()
        .min(1, 'Selecciona un producto.')
        .uuid('Selecciona un producto válido.'),
      reason: z.enum(MOVEMENT_REASON_LITERALS, {
        message: 'Selecciona un motivo.',
      }),
      date: z.string().min(1, 'Indica la fecha y hora del movimiento.'),
    })
    .superRefine((data, ctx) => {
      const parsedDate = new Date(data.date);
      if (Number.isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: 'custom',
          message: 'La fecha u hora no son válidas.',
          path: ['date'],
        });
      }
      if (data.type === 'OUT') {
        const stock = getStockActual(data.productId);
        if (stock !== undefined && data.quantity > stock) {
          ctx.addIssue({
            code: 'custom',
            message: `Solo puedes sacar hasta ${stock} unidades (lo que hay disponible).`,
            path: ['quantity'],
          });
        }
      }
    });
}

export type RegisterMovementParsed = z.output<
  ReturnType<typeof buildRegisterMovementSchema>
>;

export type CreateMovementBody = {
  type: string;
  quantity: number;
  productId: string;
  reason: string;
  date: string;
};

export function mapRegisterMovementToApiBody(
  parsed: RegisterMovementParsed,
): CreateMovementBody {
  return {
    type: parsed.type,
    quantity: parsed.quantity,
    productId: parsed.productId,
    reason: parsed.reason,
    date: new Date(parsed.date).toISOString(),
  };
}

function mapProductListResponse(raw: unknown): ProductListItem[] {
  const parsed = productListSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Respuesta inválida de GET /products: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.response.use(
    (response) => response,
    (err: AxiosError) => {
      const status = err.response?.status ?? 0;
      const data = err.response?.data;
      const body =
        typeof data === 'string'
          ? data
          : data !== undefined
            ? JSON.stringify(data)
            : err.message;
      throw new HttpError(status, body);
    },
  );

  return instance;
}

const apiClient = createApiClient();

export function useProductsQuery() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<unknown>('/products', { signal });
      const items = mapProductListResponse(res.data);
      return items.filter((p) => p.status === PRODUCT_STATUS.ACTIVO);
    },
  });
}

export function useRegisterMovementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateMovementBody) => {
      await apiClient.post('/movements', body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
