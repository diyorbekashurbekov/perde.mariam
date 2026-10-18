import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Жиналған (build) сайт GitHub Pages-те /perde.mariam/ ішкі папкасында тұрады.
// Екі бет жиналады: сайттың өзі (index.html) және админ панель (admin/index.html → /perde.mariam/admin/).
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/perde.mariam/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin/index.html'),
      },
    },
  },
}))
