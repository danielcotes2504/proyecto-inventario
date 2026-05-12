import { Badge } from '#/components/ui/badge';

import { isLowStock } from '#/lib/stock-m8';

type StockBadgeProps = {
  stockActual: number;
  stockMinimo: number;
  unit?: string;
};

export function StockBadge({ stockActual, stockMinimo, unit = 'unidades' }: StockBadgeProps) {
  const low = isLowStock(stockActual, stockMinimo);
  const label = low
    ? `Atención: quedan ${stockActual} ${unit} y el mínimo recomendado es ${stockMinimo}. Considera reponer.`
    : `Stock suficiente: ${stockActual} ${unit} (mínimo ${stockMinimo}).`;

  return (
    <Badge variant={low ? 'destructive' : 'secondary'} role="status" aria-label={label}>
      {low ? 'Stock bajo' : 'En orden'}
    </Badge>
  );
}
