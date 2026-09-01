import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL

  return {
    plugins: [react()],
    test: {
      css: true,
    },
    server: backendUrl
      ? {
          proxy: {
            '/api': {
              target: backendUrl,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  }
})
