import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    rollupOptions: {
      // 双入口：主站 index.html + 访问看板 stats.html
      input: {
        main: resolve(__dirname, 'index.html'),
        stats: resolve(__dirname, 'stats.html')
      },
      output: {
        manualChunks: {
          vendor: ['vue']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
