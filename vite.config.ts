import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, 
    port: 3000,
  },


  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  
  // Enable more detailed source maps in development
  css: {
    devSourcemap: true,
  },
})
