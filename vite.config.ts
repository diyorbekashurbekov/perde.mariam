import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Жиналған (build) сайт GitHub Pages-те /perde.mariam/ ішкі папкасында тұрады.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/perde.mariam/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
}))
