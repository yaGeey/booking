import { createFileRoute } from '@tanstack/react-router'
import { getCurrentUser } from '@/lib/auth'

export const Route = createFileRoute('/dashboard/')({
   component: RouteComponent,
   loader: async () => await getCurrentUser(),
})

function RouteComponent() {
   const me = Route.useLoaderData()
   const navigate = Route.useNavigate()

   if (me?.role !== 'ADMIN') {
      navigate({ to: '/auth/login' })
      return null
   }
   return <div>Hello "/admin/"!</div>
}
