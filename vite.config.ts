import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base 使用相对路径：同时兼容 EdgeOne 根路径部署与 GitHub Pages 子路径部署
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5180,
  },
})
