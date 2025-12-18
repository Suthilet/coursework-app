import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: 'localhost',
    hmr: {
      overlay: false // Отключить overlay при ошибках
    }
  }
})