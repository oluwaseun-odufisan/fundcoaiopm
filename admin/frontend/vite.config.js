import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    mimeTypes: {
      'js': 'application/javascript',
    },
    port: 5174, // Fixed port admin frontend
    strictPort: true, 
  },
})
