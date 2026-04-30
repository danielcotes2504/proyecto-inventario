import { z } from 'zod';

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
        .pipe(
          z.coerce
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
