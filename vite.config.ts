import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pages from 'vite-plugin-pages'
import svgr from 'vite-plugin-svgr'
import { VitePluginDocument } from 'vite-plugin-document'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pages(), svgr(), VitePluginDocument()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
