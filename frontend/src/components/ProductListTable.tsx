import type { UseQueryResult } from '@tanstack/react-query';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Skeleton } from '#/components/ui/skeleton';

import type { ProductListItem } from '#/services/api';

import { ProductCard } from '#/components/ProductCard';

type ProductListTableProps = {
  query: UseQueryResult<ProductListItem[], Error>;
};

export function ProductListTable({ query }: ProductListTableProps) {
  if (query.isPending) {
    return <ProductListSkeleton />;
  }
  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No pudimos mostrar tus productos</AlertTitle>
        <AlertDescription className="flex flex-col gap-1">
          <span>
            Comprueba tu conexión o vuelve a intentarlo en unos segundos.
          </span>
          {query.error.message.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {query.error.message}
            </span>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }
  return <ProductListLoaded products={query.data} />;
}

function ProductListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function ProductListLoaded({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <Alert>
        <AlertTitle>No hay productos para mostrar</AlertTitle>
        <AlertDescription>
          Cuando des de alta productos activos, aparecerán automáticamente en
          esta lista.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Unidad</TableHead>
          <TableHead className="text-right">Disponible</TableHead>
          <TableHead className="text-right">Mínimo</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </TableBody>
    </Table>
  );
}
