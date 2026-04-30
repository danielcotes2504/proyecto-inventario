import { useEffect, useMemo, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '#/app/lib/api-error-message';

import { mapRegisterMovementToApiBody } from '../mappers/register-movement.mapper';
import {
  buildRegisterMovementSchema,
  getDefaultRegisterMovementValues,
} from '../schemas/register-movement.schema';

import type { ProductListItem } from '../schemas/product-list.schema';

import { validationErrorsFromZodSafeParse } from './register-movement-form-validate';
import { useRegisterMovementMutation } from './use-register-movement-mutation';

export function useRegisterMovementForm(
  products: ProductListItem[],
  dialogOpen: boolean,
  onRegistered?: () => void,
) {
  const mutation = useRegisterMovementMutation();

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
        onRegistered?.();
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error));
      }
    },
  });

  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
    }
  }, [dialogOpen, form]);

  return { form, isPending: mutation.isPending };
}
