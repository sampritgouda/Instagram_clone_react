import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Required: tells browser it's allowed to register the SW at root scope
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
})
