/** M8 inclusivo: alerta cuando `stock_actual <= stock_minimo`. */
export function isLowStock(stockActual: number, stockMinimo: number): boolean {
  return stockActual <= stockMinimo;
}
