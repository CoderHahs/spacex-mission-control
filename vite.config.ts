import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Alias missing Three.js subpaths that globe.gl@2.24.0 tries to import
      // These subpaths are only available in Three.js r163+, but we're using 0.160.0
      'three/webgpu': 'three',
      'three/tsl': 'three',
      'three/addons': 'three/examples/jsm',
    },
  },
  optimizeDeps: {
    include: ['globe.gl', 'three', 'satellite.js'],
  },
})
