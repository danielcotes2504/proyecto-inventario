import { createFileRoute } from '@tanstack/react-router'

import { ProductDashboardPage } from '#/app/features/product/dashboard/index.tsx'

export const Route = createFileRoute('/')({
  component: ProductDashboardPage,
})
