import type { ZodIssue, ZodSafeParseResult } from 'zod';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '#/lib/api-error-message';
import type { ProductListItem } from '#/services/api';
import {
  buildRegisterMovementSchema,
  getDefaultRegisterMovementValues,
  mapRegisterMovementToApiBody,
  useRegisterMovementMutation,
} from '#/services/api';

function zodIssuesToFormFields(
  issues: ZodIssue[],
): Partial<Record<string, string>> {
  const fields: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

function validationErrorsFromZodSafeParse<T>(
  result: ZodSafeParseResult<T>,
): { fields: Partial<Record<string, string>> } | undefined {
  if (result.success) {
    return undefined;
  }
  return { fields: zodIssuesToFormFields(result.error.issues) };
}

type UseMovementFormOptions = {
  dialogOpen: boolean;
  resetWhenClosed?: boolean;
  onRegistered?: () => void;
};

export function useMovementForm(
  products: ProductListItem[],
  options: UseMovementFormOptions,
) {
  const mutation = useRegisterMovementMutation();
  const resetWhenClosed = options.resetWhenClosed ?? true;

  const schema = useMemo(
    () =>
      buildRegisterMovementSchema(
        (productId) => products.find((p) => p.id === productId)?.stock_actual,
      ),
    [products],
  );

  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const form = useForm({
    defaultValues: getDefaultRegisterMovementValues(),
    validators: {
      onChange: ({ value }) =>
        validationErrorsFromZodSafeParse(schemaRef.current.safeParse(value)),
      onSubmit: ({ value }) =>
        validationErrorsFromZodSafeParse(schemaRef.current.safeParse(value)),
    },
    onSubmit: async ({ value }) => {
      const parsed = schemaRef.current.safeParse(value);
      if (!parsed.success) {
        return;
      }
      try {
        await mutation.mutateAsync(mapRegisterMovementToApiBody(parsed.data));
        toast.success('Listo: el movimiento quedó registrado.');
        form.reset();
        options.onRegistered?.();
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error));
      }
    },
  });

  useEffect(() => {
    if (resetWhenClosed && !options.dialogOpen) {
      form.reset();
    }
  }, [options.dialogOpen, resetWhenClosed, form]);

  return { form, isPending: mutation.isPending };
}

export type MovementFormInstance = ReturnType<typeof useMovementForm>;
export type MovementFormApi = MovementFormInstance['form'];
