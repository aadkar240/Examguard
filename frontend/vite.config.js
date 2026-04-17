import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawBackendUrl = env.VITE_API_URL || 'http://localhost:5000'
  const backendBaseUrl = rawBackendUrl.replace(/\/+$/, '').replace(/\/api$/, '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendBaseUrl,
          changeOrigin: true,
        }
      }
    }
  }
})
