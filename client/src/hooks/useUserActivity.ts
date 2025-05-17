import { useEffect, useRef, useState } from 'react'
import { socket } from '@/socket'

export default function useUserActivity() {
   const lastActivityRef = useRef(Date.now());

   useEffect(() => {
      const updateActivity = () => lastActivityRef.current = Date.now();

      const interval = setInterval(() => {
         const isActive = Date.now() - lastActivityRef.current < 30_000;
         console.log(isActive);
         if (isActive && document.visibilityState === 'visible') {
            socket.emit('ping');
         }
      }, 20_000);

      const listeners = ['mousemove', 'keydown', 'click', 'scroll'];
      listeners.forEach((listener) => {
         window.addEventListener(listener, updateActivity);
      });
      return () => {
         clearInterval(interval);
         listeners.forEach((listener) => {
            window.removeEventListener(listener, updateActivity);
         });
      };
   }, []);
}
