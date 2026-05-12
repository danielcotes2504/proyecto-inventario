import {
  TableCell,
  TableRow,
} from '#/components/ui/table';

import type { ProductListItem } from '#/services/api';
import { PRODUCT_UNIT_LABELS } from '#/services/api';

import { StockBadge } from '#/components/StockBadge';

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>{PRODUCT_UNIT_LABELS[product.unit]}</TableCell>
      <TableCell className="text-right tabular-nums">{product.stock_actual}</TableCell>
      <TableCell className="text-right tabular-nums">{product.stock_minimo}</TableCell>
      <TableCell>
        <StockBadge
          stockActual={product.stock_actual}
          stockMinimo={product.stock_minimo}
          unit={PRODUCT_UNIT_LABELS[product.unit]}
        />
      </TableCell>
    </TableRow>
  );
}
