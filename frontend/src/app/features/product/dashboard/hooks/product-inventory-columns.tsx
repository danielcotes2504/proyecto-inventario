import { createColumnHelper } from '@tanstack/react-table';

import type { ProductListItem } from '../schemas/product-list.schema';

import { StockBadge } from '../components/stock-badge';

export type InventoryColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const columnHelper = createColumnHelper<ProductListItem>();

export const productInventoryColumns = [
  columnHelper.accessor('name', {
    header: 'Nombre',
    cell: (info) => (
      <span className="font-medium">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('category', {
    header: 'Categoría',
  }),
  columnHelper.accessor('unit', {
    header: 'Unidad',
  }),
  columnHelper.accessor('stock_actual', {
    header: 'Disponible',
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
    },
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('stock_minimo', {
    header: 'Mínimo',
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
    },
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: 'alert',
    header: 'Estado',
    cell: ({ row }) => (
      <StockBadge
        stockActual={row.original.stock_actual}
        stockMinimo={row.original.stock_minimo}
      />
    ),
  }),
];
