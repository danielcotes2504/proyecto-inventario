import { Plus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Button } from '#/components/ui/button';

import { ProductListTable } from '#/components/ProductListTable';
import { useProductsQuery } from '#/services/api';

export function ProductList() {
  const query = useProductsQuery();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle>Tus productos</CardTitle>
            <CardDescription>
              Aquí ves el stock disponible de cada artículo activo. Si las
              existencias llegan al mínimo que definiste, verás una alerta en
              rojo para que puedas reponer a tiempo.
            </CardDescription>
          </div>
          <Button
            type="button"
            disabled={query.isPending}
            className="w-fit"
            onClick={() => void navigate({ to: '/movements' })}
          >
            <Plus aria-hidden className="size-4" />
            Registrar movimiento
          </Button>
        </CardHeader>
        <CardContent>
          <ProductListTable query={query} />
        </CardContent>
      </Card>
    </div>
  );
}
