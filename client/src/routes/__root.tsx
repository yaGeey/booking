import useUserActivity from '@/hooks/useUserActivity'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
   component: () => {
      useUserActivity()
      return (
         <>
            <Outlet />
            {/* <TanStackRouterDevtools /> */}
         </>
      )
   },
})
