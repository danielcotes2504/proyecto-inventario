import { Badge } from '#/components/ui/badge';

import { isLowStock } from '#/app/lib/stock-m8';

type StockBadgeProps = {
  stockActual: number;
  stockMinimo: number;
};

export function StockBadge({ stockActual, stockMinimo }: StockBadgeProps) {
  const low = isLowStock(stockActual, stockMinimo);
  const label = low
    ? `Atención: quedan ${stockActual} unidades y el mínimo recomendado es ${stockMinimo}. Considera reponer.`
    : `Stock suficiente: ${stockActual} unidades (mínimo ${stockMinimo}).`;

  return (
    <Badge variant={low ? 'destructive' : 'secondary'} role="status" aria-label={label}>
      {low ? 'Stock bajo' : 'En orden'}
    </Badge>
  );
}
