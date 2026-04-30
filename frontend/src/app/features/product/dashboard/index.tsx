import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

import { ProductInventoryTable } from './components/product-inventory-table';
import { useProductDashboard } from './hooks/use-product-dashboard';

export function ProductDashboardPage() {
  const query = useProductDashboard();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Tus productos</CardTitle>
          <CardDescription>
            Aquí ves el stock disponible de cada artículo activo. Si las
            existencias llegan al mínimo que definiste, verás una alerta en rojo
            para que puedas reponer a tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductInventoryTable query={query} />
        </CardContent>
      </Card>
    </div>
  );
}
