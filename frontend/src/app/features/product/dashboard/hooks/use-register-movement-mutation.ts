import { useMutation, useQueryClient } from '@tanstack/react-query';

import { movementService } from '#/app/services/movement/movement.service';
import type { CreateMovementBody } from '#/app/services/movement/movement.types';
import { productKeys } from '#/app/services/product/product.types';

export function useRegisterMovementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateMovementBody) => movementService.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
