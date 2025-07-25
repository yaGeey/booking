import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact(), tailwindcss(), svgr()],
   test: {
      globals: true,
      environment: 'jsdom',
   },
   resolve: {
      alias: {
         '@': resolve(__dirname, './src'),
      },
   },
   server: {
      host: true,
      watch: {
         // for hot reload in Docker
         usePolling: true,
         interval: 1000,
      },
   },
   build: {
      target: 'esnext',
      manifest: true, // for Nginx
   }
})
