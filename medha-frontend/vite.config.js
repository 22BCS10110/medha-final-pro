import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Strip trailing slashes so the proxy never produces `//api/...`.
  const target = (env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
  const isProd = mode === 'production'
  return {
    base: isProd ? './' : '/',
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
