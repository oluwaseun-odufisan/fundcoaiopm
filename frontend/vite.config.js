import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    sourcemap: false,           // saves RAM on Vercel
    chunkSizeWarningLimit: 4000, // removes the warning

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Heavy report libraries → their own chunks
            if (id.includes('xlsx')) return 'xlsx'
            if (id.includes('jspdf')) return 'jspdf'
            if (id.includes('pptxgenjs')) return 'pptxgenjs'
            if (id.includes('jszip')) return 'jszip'

            // Everything else
            return 'vendor'
          }
        }
      }
    }
  }
})