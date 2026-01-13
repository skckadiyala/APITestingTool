import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.VITE_FRONTEND_HOST || 'localhost'
  
  return {
    plugins: [react()],
    server: {
      host: host.toLowerCase(),
      port: parseInt(env.VITE_FRONTEND_PORT || '5173'),
      allowedHosts: [
        host,
        host.toLowerCase(),
        host.toUpperCase(),
        'localhost',
        '127.0.0.1',
      ],
    },
  }
})
