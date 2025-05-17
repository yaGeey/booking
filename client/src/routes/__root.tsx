import useUserActivity from '@/hooks/useUserActivity'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
   component: () => {
      useUserActivity();
      return (
         <>
            <Outlet />
            <TanStackRouterDevtools />
         </>
      )
   },
})
