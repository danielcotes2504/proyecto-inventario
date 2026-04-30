import { useMemo } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { Column } from '@tanstack/react-table';

import type { ProductListItem } from '../schemas/product-list.schema';

import type { InventoryColumnMeta } from './product-inventory-columns';
import { productInventoryColumns } from './product-inventory-columns';

export function inventoryColumnMeta(
  column: Column<ProductListItem, unknown>,
): InventoryColumnMeta {
  return column.columnDef.meta ?? {};
}

export function useProductInventoryReactTable(data: ProductListItem[]) {
  const columns = useMemo(() => productInventoryColumns, []);

  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}
