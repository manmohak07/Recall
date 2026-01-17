import { getSessionFn } from '@/data/session'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/import' })
  },
  // component: RouteComponent,
  // loader: () => getSessionFn(),

})
