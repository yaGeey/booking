import Card from '@/components/room/Card'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/test/')({
   component: RouteComponent,
})

function RouteComponent() {
   return (
      <div>
      </div>
   )
}
