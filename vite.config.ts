import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'three/webgpu': 'three',
    },
  },
  optimizeDeps: {
    include: ['globe.gl', 'three', 'satellite.js'],
  },
})
