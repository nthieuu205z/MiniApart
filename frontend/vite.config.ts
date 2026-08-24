import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The frontend always calls the backend through the relative path /api. In development
// this proxy stands in for the Nginx reverse proxy that will do the same job in
// production (Vertical Slice 11), so no component ever hardcodes a backend host.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
