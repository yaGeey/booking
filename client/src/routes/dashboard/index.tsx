import { getUserSession } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
   component: RouteComponent,
   loader: async () => await getUserSession(),
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
