import { createFileRoute } from '@tanstack/react-router'

import { ProductList } from '#/pages/ProductList'

export const Route = createFileRoute('/')({
  component: ProductList,
})
