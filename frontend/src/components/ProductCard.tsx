import {
  TableCell,
  TableRow,
} from '#/components/ui/table';

import type { ProductListItem } from '#/services/api';

import { StockBadge } from '#/components/StockBadge';

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>{product.unit}</TableCell>
      <TableCell className="text-right tabular-nums">{product.stock_actual}</TableCell>
      <TableCell className="text-right tabular-nums">{product.stock_minimo}</TableCell>
      <TableCell>
        <StockBadge
          stockActual={product.stock_actual}
          stockMinimo={product.stock_minimo}
        />
      </TableCell>
    </TableRow>
  );
}
