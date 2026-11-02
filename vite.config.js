import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/media_uploads': {
        target: 'https://server.familiess.com',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://server.familiess.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
