import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    sourcemap: false,           // saves memory
    chunkSizeWarningLimit: 4000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Force each heavy library into its own tiny chunk
            if (id.includes('xlsx')) return 'xlsx'
            if (id.includes('jspdf')) return 'jspdf'
            if (id.includes('pptxgenjs')) return 'pptxgenjs'
            if (id.includes('jszip')) return 'jszip'

            // Everything else in a normal vendor chunk
            return 'vendor'
          }
        }
      }
    }
  }
})