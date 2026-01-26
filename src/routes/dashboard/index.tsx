import { getSessionFn } from '@/data/session'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/items' })
  },
  // component: RouteComponent,
  // loader: () => getSessionFn(),

})
