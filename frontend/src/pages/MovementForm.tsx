import { Link, useNavigate } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Skeleton } from '#/components/ui/skeleton';

import { MovementFormFields } from '#/components/MovementForm';
import { useMovementForm } from '#/hooks/use-movement-form';
import { useProductsQuery } from '#/services/api';

export function MovementFormPage() {
  const query = useProductsQuery();
  const products = query.data ?? [];
  const navigate = useNavigate();

  const { form, isPending } = useMovementForm(products, {
    dialogOpen: true,
    resetWhenClosed: false,
    onRegistered: () => void navigate({ to: '/' }),
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6 md:p-8">
      <Link
        to="/"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        ← Volver al listado
      </Link>
      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Registrar movimiento</CardTitle>
          <CardDescription>
            Completa los datos del movimiento. Si es una salida, no podrás
            indicar más unidades de las que hay disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <Skeleton className="h-48 w-full" />
          ) : query.isError ? (
            <Alert variant="destructive">
              <AlertTitle>No pudimos cargar los productos</AlertTitle>
              <AlertDescription>{query.error.message}</AlertDescription>
            </Alert>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
            >
              <MovementFormFields
                form={form}
                products={products}
                isPending={isPending}
              />
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
