import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["essence-anchor-tiling.ngrok-free.dev"],
    proxy: {
      "/auth": "http://localhost:8000",
      "/assets": "http://localhost:8000",
      "/portfolios": "http://localhost:8000",
    },
  },
})
