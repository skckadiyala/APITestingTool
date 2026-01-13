import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'webautpdvhil1.corp.cdw.com',
    port: 5173,
    allowedHosts: [
      'webautpdvhil1.corp.cdw.com',
      'localhost',
      '127.0.0.1',
    ],
  },
})
