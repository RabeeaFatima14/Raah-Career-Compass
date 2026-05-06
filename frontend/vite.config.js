import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Listen on all interfaces (0.0.0.0)
    strictPort: false, // Use next available port if 3000 is taken
  }
})