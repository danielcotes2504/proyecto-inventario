import { createFileRoute } from '@tanstack/react-router'

import { MovementFormPage } from '#/pages/MovementForm'

export const Route = createFileRoute('/movements')({
  component: MovementFormPage,
})
