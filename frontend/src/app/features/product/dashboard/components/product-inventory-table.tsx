import type { UseQueryResult } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';

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

import type { ProductListItem } from '../schemas/product-list.schema';

import {
  inventoryColumnMeta,
  useProductInventoryReactTable,
} from '../hooks/use-product-inventory-react-table';

type ProductInventoryTableProps = {
  query: UseQueryResult<ProductListItem[], Error>;
};

export function ProductInventoryTable({ query }: ProductInventoryTableProps) {
  if (query.isPending) {
    return <ProductInventorySkeleton />;
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
  return <ProductInventoryLoaded products={query.data} />;
}

function ProductInventorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function ProductInventoryLoaded({ products }: { products: ProductListItem[] }) {
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

  return <ProductInventoryDataTable products={products} />;
}

function ProductInventoryDataTable({ products }: { products: ProductListItem[] }) {
  const table = useProductInventoryReactTable(products);

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = inventoryColumnMeta(header.column);
              return (
                <TableHead key={header.id} className={meta.headerClassName}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => {
              const meta = inventoryColumnMeta(cell.column);
              return (
                <TableCell key={cell.id} className={meta.cellClassName}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
