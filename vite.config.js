import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/critiques-services.com/',
  plugins: [
    react()
  ],
  server: {
    port: 3000,
    host: true
  }
})